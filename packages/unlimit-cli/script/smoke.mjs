// Run after bun run build --with-engine. Uses a synthetic local model, never a paid provider.
import { createServer } from "node:http"
import { spawn } from "node:child_process"
import { mkdtemp, writeFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import assert from "node:assert/strict"
import { startAccessServer } from "@unlimitcode/account/access-server"
const directory = await mkdtemp(join(tmpdir(), "unlimit-paid-task-"))
const state = { requests: 0, active: false }
const authority = await startAccessServer(async () => ({ status: "signed-in", accessUntil: state.active ? new Date(Date.now() + 60000).toISOString() : null }))
const server = createServer(async (req, res) => {
  let body = ""
  for await (const part of req) body += part
  assert.equal(req.headers.authorization, "Bearer synthetic-local-key")
  assert.equal(JSON.parse(body).model, "test")
  state.requests++
  res.writeHead(200, { "Content-Type": "text/event-stream" })
  res.write(
    "data: " +
      JSON.stringify({
        id: "test",
        object: "chat.completion.chunk",
        created: 1,
        model: "test",
        choices: [
          { index: 0, delta: { role: "assistant", content: "Subscribed user-provider coding works." }, finish_reason: null },
        ],
      }) +
      "\n\n",
  )
  res.write(
    "data: " +
      JSON.stringify({
        id: "test",
        object: "chat.completion.chunk",
        created: 1,
        model: "test",
        choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      }) +
      "\n\n",
  )
  res.end("data: [DONE]\n\n")
})
await new Promise((r) => server.listen(0, "127.0.0.1", r))
try {
  await writeFile(join(directory, "README.md"), "Temporary task verification project.\n")
  const config = {
    model: "local-test/test",
    provider: {
      "local-test": {
        name: "Local test fixture",
        npm: "@ai-sdk/openai-compatible",
        api: `http://127.0.0.1:${server.address().port}/v1`,
        options: { apiKey: "synthetic-local-key" },
        models: { test: { name: "Test", limit: { context: 16384, output: 1024 } } },
      },
    },
  }
  const run = (authorized) => new Promise((resolve, reject) => {
    const child = spawn(
      fileURLToPath(new URL(`../dist/unlimit-engine${process.platform === "win32" ? ".exe" : ""}`, import.meta.url)),
      [
        "run",
        "--model",
        "local-test/test",
        "--format",
        "json",
        "Say the verification phrase.",
      ],
      {
        cwd: directory,
        env: {
          PATH: process.env.PATH,
          ...(authorized ? authority.environment : {}),
          OPENCODE_TEST_HOME: directory,
          TMPDIR: directory,
          XDG_CONFIG_HOME: join(directory, "config"),
          XDG_DATA_HOME: join(directory, "data"),
          XDG_CACHE_HOME: join(directory, "cache"),
          XDG_STATE_HOME: join(directory, "state"),
          OPENCODE_CONFIG_CONTENT: JSON.stringify(config),
          OPENCODE_DISABLE_DEFAULT_PLUGINS: "1",
          OPENCODE_DISABLE_LSP_DOWNLOAD: "1",
          OPENCODE_DISABLE_MODELS_FETCH: "1",
          UNLIMIT_MANAGED: "1",
          UNLIMIT_BRIDGE_URL: "http://127.0.0.1:1/v1",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    )
    let out = ""
    let err = ""
    const timer = setTimeout(() => child.kill("SIGTERM"), 60000)
    child.stdout.on("data", (b) => (out += b))
    child.stderr.on("data", (b) => (err += b))
    child.once("error", reject)
    child.once("exit", (code) => {
      clearTimeout(timer)
      resolve({ code, out, err })
    })
  })
  const missing = await run(false)
  assert.notEqual(missing.code, 0)
  assert.equal(state.requests, 0)
  const unpaid = await run(true)
  assert.notEqual(unpaid.code, 0)
  assert.equal(state.requests, 0)
  state.active = true
  const result = await run(true)
  if (result.code !== 0) console.log(result.err.slice(-2000))
  assert.equal(result.code, 0)
  assert.ok(state.requests > 0)
  assert.match(result.out, /Subscribed user-provider coding works/)
  console.log(
    "PASS: compiled engine denies missing and unpaid accounts before provider calls, and a subscribed account completes a task with its own local provider.",
  )
} finally {
  await authority.close()
  server.closeAllConnections()
  await new Promise((r) => server.close(r))
  await rm(directory, { recursive: true, force: true })
}
