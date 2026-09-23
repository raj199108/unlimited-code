import { describe, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { createAccountSession, type Tokens } from "./session"

function fixture(initial?: Tokens) {
  const state = {
    saved: initial,
    exchanges: 0,
    challenge: "",
    rejected: false,
    displayName: "Test User",
    unavailable: false,
    requests: [] as string[],
    wait: undefined as Promise<void> | undefined,
    arrived: undefined as (() => void) | undefined,
  }
  const server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    async fetch(request) {
      const url = new URL(request.url)
      state.requests.push(url.pathname)
      if (url.pathname === "/auth/v1/oauth/token") {
        state.exchanges++
        const form = new URLSearchParams(await request.text())
        state.arrived?.()
        await state.wait
        if (state.rejected) return new Response("", { status: 401 })
        if (form.get("grant_type") === "authorization_code") {
          expect(createHash("sha256").update(form.get("code_verifier")!).digest("base64url")).toBe(state.challenge)
          expect(form.get("client_secret")).toBeNull()
        }
        return Response.json({ access_token: "access-private", refresh_token: "refresh-private", expires_in: 3600 })
      }
      if (url.pathname === "/api/account") {
        expect(request.headers.get("authorization")).toBe("Bearer access-private")
        if (state.unavailable) return new Response(null, { status: 503 })
        return Response.json({
          id: "account-a",
          email: "test@example.invalid",
          displayName: state.displayName,
        })
      }
      return new Response(null, { status: 204 })
    },
  })
  const session = createAccountSession(
    {
      issuer: server.url.origin,
      site: server.url.origin,
      clientId: "public",
      redirectUri: "unlimitcode-dev://auth/callback",
      publishableKey: "public-key",
    },
    {
      async read() {
        return state.saved
      },
      async write(value) {
        state.saved = value
      },
    },
  )
  return {
    state,
    session,
    async begin() {
      const url = new URL(await session.begin())
      state.challenge = url.searchParams.get("code_challenge")!
      return `unlimitcode-dev://auth/callback?code=code&state=${url.searchParams.get("state")}`
    },
    [Symbol.dispose]() {
      server.stop(true)
    },
  }
}

describe("native account session", () => {
  test("PKCE is bound to pending state; renderer status contains no credentials", async () => {
    using f = fixture()
    expect(await f.session.status()).toEqual({ status: "signed-out" })
    const callback = await f.begin()
    expect(await f.session.status()).toEqual({ status: "signing-in" })
    expect(await f.session.callback("opencode://auth/callback?code=x")).toBe(false)
    expect(await f.session.callback(callback.replace("state=", "state=bad"))).toBe(true)
    expect(f.state.exchanges).toBe(0)
    await f.session.callback(callback)
    expect(f.state.saved?.refresh).toBe("refresh-private")
    expect(await f.session.status()).toEqual({
      status: "signed-in",
      id: "account-a",
      email: "test@example.invalid",
      displayName: "Test User",
    })
    await f.session.callback(callback)
    expect(f.state.exchanges).toBe(1)
    await f.session.signOut()
    expect(f.state.saved).toBeUndefined()
    expect(await f.session.status()).toEqual({ status: "signed-out" })
  })
  test("profile refresh observes edits and reports outages without exposing credentials", async () => {
    using f = fixture({ access: "access-private", refresh: "refresh-private", expires: Date.now() + 3600000 })
    expect((await f.session.status()).displayName).toBe("Test User")
    f.state.displayName = "Updated User"
    expect((await f.session.status(true)).displayName).toBe("Updated User")
    f.state.unavailable = true
    expect(await f.session.status(true)).toEqual({ status: "error" })
  })
  test("refresh is shared by simultaneous requests", async () => {
    using f = fixture({ access: "old", refresh: "old-refresh", expires: 0 })
    expect(await Promise.all([f.session.token(), f.session.token(), f.session.token()])).toEqual(
      Array(3).fill("access-private"),
    )
    expect(f.state.exchanges).toBe(1)
  })
  test("sign-out fences a late refresh so it cannot restore credentials", async () => {
    using f = fixture({ access: "old", refresh: "old-refresh", expires: 0 })
    const gate = Promise.withResolvers<void>()
    const arrived = Promise.withResolvers<void>()
    f.state.wait = gate.promise
    f.state.arrived = arrived.resolve
    const pending = f.session.token()
    const result = pending.then(
      () => "unexpected",
      () => "rejected",
    )
    await arrived.promise
    await f.session.signOut()
    gate.resolve()
    expect(await result).toBe("rejected")
    expect(f.state.saved).toBeUndefined()
    expect(await f.session.status()).toEqual({ status: "signed-out" })
  })
  test("revoked refresh clears persisted session", async () => {
    using f = fixture({ access: "old", refresh: "revoked", expires: 0 })
    f.state.rejected = true
    await expect(f.session.token()).rejects.toThrow("account_token_unavailable")
    expect(f.state.saved).toBeUndefined()
  })
  test("duplicate state and fragment callbacks are rejected without consuming a valid login", async () => {
    using f = fixture()
    const callback = await f.begin()
    await f.session.callback(`${callback}&state=other`)
    await f.session.callback(`${callback}#fragment`)
    expect(f.state.exchanges).toBe(0)
    await f.session.callback(callback)
    expect(f.state.exchanges).toBe(1)
  })
})
