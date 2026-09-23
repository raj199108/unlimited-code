// The bridge runs in Electron's Node process. Test actual Node fetch/stream cancellation.
import { test } from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { startManagedBridge } from "../src/managed/bridge.ts"

test("bridge authenticates locally, fixes destination and preserves streamed tool data", async () => {
  const captured = []
  const payload = 'data: {"choices":[{"delta":{"tool_calls":[{"id":"call_1"}]}}]}\n\ndata: [DONE]\n\n'
  const upstream = createServer(async (request, response) => {
    captured.push(request)
    assert.equal(request.url, "/api/v1/chat/completions")
    assert.equal(request.headers.authorization, "Bearer native-access")
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)
    assert.deepEqual(JSON.parse(Buffer.concat(chunks).toString()), { model: "openai/gpt-6-astra", stream: true })
    response.writeHead(200, { "Content-Type": "text/event-stream", "Set-Cookie": "secret=not-forwarded" })
    response.write(payload.slice(0, 30))
    response.end(payload.slice(30))
  })
  await new Promise((resolve) => upstream.listen(0, "127.0.0.1", resolve))
  const bridge = await startManagedBridge(`http://127.0.0.1:${upstream.address().port}`, async () => "native-access")
  const send = (path, key = bridge.key, body = JSON.stringify({ model: "openai/gpt-6-astra", stream: true })) =>
    fetch(`${bridge.url}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body,
    })
  try {
    assert.equal((await send("/chat/completions", "wrong")).status, 401)
    assert.equal((await send("/other")).status, 404)
    assert.equal((await send("/chat/completions", bridge.key, "a".repeat(2097153))).status, 413)
    assert.equal(captured.length, 0)
    const result = await send("/chat/completions")
    assert.equal(result.headers.get("set-cookie"), null)
    assert.equal(await result.text(), payload)
    assert.equal(captured.length, 1)
  } finally {
    await bridge.close()
    upstream.closeAllConnections()
    upstream.close()
  }
})

test("signed-out accounts cannot call the gateway", async () => {
  const bridge = await startManagedBridge("http://127.0.0.1:1", async () => {
    throw new Error("signed out")
  })
  try {
    const result = await fetch(`${bridge.url}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${bridge.key}`, "Content-Type": "application/json" },
      body: "{}",
    })
    assert.equal(result.status, 401)
  } finally {
    await bridge.close()
  }
})

test("consumer cancellation closes the upstream stream", async () => {
  const cancelled = Promise.withResolvers()
  const upstream = createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "text/event-stream" })
    response.write("data: waiting\n\n")
    response.once("close", () => cancelled.resolve())
  })
  await new Promise((resolve) => upstream.listen(0, "127.0.0.1", resolve))
  const bridge = await startManagedBridge(`http://127.0.0.1:${upstream.address().port}`, async () => "native-access")
  const timeout = Promise.withResolvers()
  const timer = setTimeout(() => timeout.reject(new Error("upstream was not cancelled")), 3000)
  try {
    const abort = new AbortController()
    const result = await fetch(`${bridge.url}/chat/completions`, {
      method: "POST",
      signal: abort.signal,
      headers: { Authorization: `Bearer ${bridge.key}`, "Content-Type": "application/json" },
      body: "{}",
    })
    await result.body.getReader().read()
    abort.abort()
    await Promise.race([cancelled.promise, timeout.promise])
  } finally {
    clearTimeout(timer)
    await bridge.close()
    upstream.closeAllConnections()
    upstream.close()
  }
})
