import { test } from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { createServer } from "node:http"
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"

test("independent Node processes share a rotating session without reusing a refresh token", async () => {
  const directory = await mkdtemp(join(tmpdir(), "unlimit-process-"))
  const state = { exchanges: 0 }
  const server = createServer((req, res) => {
    req.resume()
    if (req.url !== "/auth/v1/oauth/token") return res.writeHead(204).end()
    state.exchanges++
    if (state.exchanges > 1) return res.writeHead(401).end()
    res.end(JSON.stringify({ access_token: "synthetic-new", refresh_token: "synthetic-rotated", expires_in: 3600 }))
  })
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const address = server.address()
  assert.ok(address && typeof address !== "string")
  const run = (operation: string) =>
    new Promise<number | null>((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [
          "--experimental-strip-types",
          fileURLToPath(new URL("./fixtures/account-child.mjs", import.meta.url)),
          directory,
          operation,
        ],
        { stdio: "ignore" },
      )
      child.once("error", reject)
      child.once("exit", resolve)
    })
  try {
    await writeFile(
      join(directory, "config.json"),
      JSON.stringify({
        issuer: `http://127.0.0.1:${address.port}`,
        site: `http://127.0.0.1:${address.port}`,
        clientId: "cli",
        publishableKey: "public",
        redirectUri: "http://127.0.0.1:32187/auth/callback",
      }),
    )
    await writeFile(
      join(directory, "synthetic.json"),
      JSON.stringify({ access: "synthetic-old", refresh: "synthetic-old", expires: 0 }),
      { mode: 0o600 },
    )
    assert.deepEqual(await Promise.all([run("token"), run("token"), run("token")]), [0, 0, 0])
    assert.equal(state.exchanges, 1)
    assert.equal(JSON.parse(await readFile(join(directory, "synthetic.json"), "utf8")).refresh, "synthetic-rotated")
    assert.equal(await run("logout"), 0)
    assert.equal(await run("token"), 1)
  } finally {
    server.closeAllConnections()
    await new Promise<void>((resolve) => server.close(() => resolve()))
    await rm(directory, { recursive: true, force: true })
  }
})
