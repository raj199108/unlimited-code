import { test } from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { mkdtemp, rm } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createCliAccount } from "../src/account.ts"
import type { Tokens } from "@unlimitcode/account/session"

test("separate CLI clients serialize refresh and logout; older login cannot overwrite logout or newer login", async () => {
  const directory = await mkdtemp(join(tmpdir(), "unlimit-account-"))
  const state = { tokens: { access: "old", refresh: "old", expires: 0 } as Tokens | undefined, exchanges: 0 }
  const server = createServer(async (req, res) => {
    req.resume()
    if (req.url === "/auth/v1/oauth/token") {
      state.exchanges++
      await new Promise((resolve) => setTimeout(resolve, 30))
      return res.end(JSON.stringify({ access_token: "fresh", refresh_token: "rotated", expires_in: 3600 }))
    }
    res.writeHead(204).end()
  })
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const address = server.address()
  assert.ok(address && typeof address !== "string")
  const config = {
    issuer: `http://127.0.0.1:${address.port}`,
    site: `http://127.0.0.1:${address.port}`,
    redirectUri: "http://127.0.0.1:32187/auth/callback",
    publishableKey: "public",
    clientId: "public",
  }
  const storage = {
    async read() {
      return state.tokens
    },
    async write(tokens: Tokens | undefined) {
      state.tokens = tokens
    },
  }
  const first = createCliAccount(config, storage, directory)
  const second = createCliAccount(config, storage, directory)
  try {
    assert.deepEqual(await Promise.all([first.token(), second.token(), first.token()]), ["fresh", "fresh", "fresh"])
    assert.equal(state.exchanges, 1)
    const beforeLogout = await first.begin()
    await second.signOut()
    await assert.rejects(
      first.commit(beforeLogout, { access: "late", refresh: "late", expires: 1 }),
      /account_session_changed/,
    )
    await assert.rejects(first.token(), /account_signed_out/)
    const old = await first.begin()
    const current = await second.begin()
    await assert.rejects(first.commit(old, { access: "old", refresh: "old", expires: 1 }), /account_session_changed/)
    await second.commit(current, { access: "latest", refresh: "latest", expires: Date.now() + 3600000 })
    await assert.rejects(
      second.commit(current, { access: "repeat", refresh: "repeat", expires: 1 }),
      /account_session_changed/,
    )
    assert.equal(await first.token(), "latest")
    await first.signOut()
    await assert.rejects(second.token(), /account_signed_out/)
  } finally {
    server.closeAllConnections()
    await new Promise<void>((resolve) => server.close(() => resolve()))
    await rm(directory, { recursive: true, force: true })
  }
})
