import { test } from "node:test"
import assert from "node:assert/strict"
import { createServer, request } from "node:http"
import { createHash } from "node:crypto"
import { startLogin } from "../src/login.ts"

async function fixture() {
  const calls = { exchanges: 0, challenge: "" }
  const auth = createServer(async (req, res) => {
    if (req.url !== "/auth/v1/oauth/token") return res.writeHead(404).end()
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(chunk)
    const form = new URLSearchParams(Buffer.concat(chunks).toString())
    calls.exchanges++
    assert.equal(form.get("client_secret"), null)
    assert.equal(createHash("sha256").update(form.get("code_verifier")!).digest("base64url"), calls.challenge)
    res.setHeader("Content-Type", "application/json")
    res.end(JSON.stringify({ access_token: "synthetic-access", refresh_token: "synthetic-refresh", expires_in: 3600 }))
  })
  await new Promise<void>((resolve) => auth.listen(0, "127.0.0.1", resolve))
  const address = auth.address()
  assert.ok(address && typeof address !== "string")
  const port = createServer()
  await new Promise<void>((resolve) => port.listen(0, "127.0.0.1", resolve))
  const callback = port.address()
  assert.ok(callback && typeof callback !== "string")
  await new Promise<void>((resolve) => port.close(() => resolve()))
  const config = {
    issuer: `http://127.0.0.1:${address.port}`,
    site: `http://127.0.0.1:${address.port}`,
    clientId: "cli-public",
    publishableKey: "public",
    redirectUri: `http://127.0.0.1:${callback.port}/auth/callback`,
  }
  return {
    config,
    calls,
    async close() {
      auth.closeAllConnections()
      await new Promise<void>((resolve) => auth.close(() => resolve()))
    },
  }
}

test("loopback login binds PKCE/state, rejects hostile requests, and consumes a callback once", async () => {
  const f = await fixture()
  const login = await startLogin(f.config)
  try {
    const auth = new URL(login.url)
    f.calls.challenge = auth.searchParams.get("code_challenge")!
    const callback = `${f.config.redirectUri}?state=${auth.searchParams.get("state")}&code=once`
    assert.equal((await fetch(callback.replace("state=", "state=wrong"))).status, 400)
    assert.equal((await fetch(`${callback}&state=duplicate`)).status, 400)
    assert.equal((await fetch(`${callback}&code=duplicate`)).status, 400)
    assert.equal((await fetch(callback, { method: "POST" })).status, 400)
    const hostileHost = await new Promise<number>((resolve) => {
      request(callback, { headers: { host: "evil.invalid" } }, (response) => {
        response.resume()
        resolve(response.statusCode!)
      }).end()
    })
    assert.equal(hostileHost, 400)
    assert.equal(f.calls.exchanges, 0)
    const response = await fetch(callback)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get("cache-control"), "no-store")
    assert.equal(response.headers.get("referrer-policy"), "no-referrer")
    assert.equal((await login.result).refresh, "synthetic-refresh")
    assert.equal((await fetch(callback)).status, 409)
    assert.equal(f.calls.exchanges, 1)
    assert.doesNotMatch(await response.text(), /synthetic|once|state=/)
  } finally {
    await login.close()
    await f.close()
  }
})

test("login fails on occupied ports, expires, rejects denial and disallows network callbacks", async () => {
  const f = await fixture()
  const login = await startLogin(f.config, 50)
  try {
    await assert.rejects(startLogin(f.config), /account_callback_port_unavailable/)
    await assert.rejects(login.result, /account_login_expired/)
    await assert.rejects(
      startLogin({ ...f.config, redirectUri: "http://0.0.0.0:32187/auth/callback" }),
      /account_callback_invalid/,
    )
  } finally {
    await login.close()
    await f.close()
  }
  const g = await fixture()
  const denied = await startLogin(g.config)
  try {
    const state = new URL(denied.url).searchParams.get("state")
    assert.equal((await fetch(`${g.config.redirectUri}?error=access_denied&state=${state}`)).status, 400)
    await assert.rejects(denied.result, /account_login_failed/)
    assert.equal(g.calls.exchanges, 0)
  } finally {
    await denied.close()
    await g.close()
  }
})
