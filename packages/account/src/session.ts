import { createHash, randomBytes, timingSafeEqual } from "node:crypto"
import type { AccountState } from "./types"

export type AccountConfig = {
  issuer: string
  clientId: string
  redirectUri: string
  site: string
  publishableKey: string
}
export type Tokens = { access: string; refresh: string; expires: number }
export type TokenStorage = { read(): Promise<Tokens | undefined>; write(value: Tokens | undefined): Promise<void> }

export function createAccountSession(config: AccountConfig, storage: TokenStorage, request: typeof fetch = fetch) {
  const state = {
    tokens: undefined as Tokens | undefined,
    loaded: false,
    epoch: 0,
    pending: undefined as { state: string; verifier: string; expires: number } | undefined,
    refresh: undefined as Promise<Tokens> | undefined,
    loading: undefined as Promise<void> | undefined,
    persistence: Promise.resolve(),
    profile: undefined as
      | {
          id?: string
          email: string
          displayName: string
          accessUntil: string | null
          checked: number
        }
      | undefined,
  }
  const persist = (tokens: Tokens | undefined, epoch: number) => {
    const task = state.persistence.then(() => (epoch === state.epoch ? storage.write(tokens) : undefined))
    state.persistence = task.catch(() => undefined)
    return task
  }
  const load = async () => {
    if (state.loaded) return
    state.loading ??= (async () => {
      const epoch = state.epoch
      const tokens = await storage.read()
      if (epoch !== state.epoch) return
      state.tokens = tokens
      state.loaded = true
    })().finally(() => {
      state.loading = undefined
    })
    await state.loading
  }
  const exchange = async (body: URLSearchParams, epoch: number) => {
    const response = await request(`${config.issuer}/auth/v1/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) {
      if (response.status === 400 || response.status === 401) {
        if (epoch === state.epoch) {
          state.tokens = undefined
          state.profile = undefined
          await persist(undefined, epoch)
        }
      }
      throw new Error("account_token_unavailable")
    }
    const value: unknown = await response.json()
    if (
      !value ||
      typeof value !== "object" ||
      !("access_token" in value) ||
      typeof value.access_token !== "string" ||
      !("refresh_token" in value) ||
      typeof value.refresh_token !== "string" ||
      !("expires_in" in value) ||
      typeof value.expires_in !== "number" ||
      !Number.isFinite(value.expires_in) ||
      value.expires_in <= 0 ||
      !value.access_token ||
      !value.refresh_token
    )
      throw new Error("account_token_invalid")
    const tokens = {
      access: value.access_token,
      refresh: value.refresh_token,
      expires: Date.now() + value.expires_in * 1000,
    }
    if (epoch !== state.epoch) throw new Error("account_session_changed")
    await persist(tokens, epoch)
    if (epoch !== state.epoch) throw new Error("account_session_changed")
    state.tokens = tokens
    return tokens
  }
  const token = async () => {
    await load()
    if (!state.tokens) throw new Error("account_signed_out")
    if (state.tokens.expires > Date.now() + 60000) return state.tokens.access
    if (!state.refresh) {
      const pending = exchange(
        new URLSearchParams({
          grant_type: "refresh_token",
          client_id: config.clientId,
          refresh_token: state.tokens.refresh,
        }),
        state.epoch,
      ).finally(() => {
        if (state.refresh === pending) state.refresh = undefined
      })
      state.refresh = pending
    }
    return (await state.refresh).access
  }
  return {
    token,
    async begin() {
      await load()
      const pending = {
        state: randomBytes(32).toString("base64url"),
        verifier: randomBytes(48).toString("base64url"),
        expires: Date.now() + 600000,
      }
      state.pending = pending
      const url = new URL(`${config.issuer}/auth/v1/oauth/authorize`)
      url.search = new URLSearchParams({
        response_type: "code",
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: "openid email profile",
        state: pending.state,
        code_challenge_method: "S256",
        code_challenge: createHash("sha256").update(pending.verifier).digest("base64url"),
      }).toString()
      return url.toString()
    },
    async callback(raw: string) {
      if (!URL.canParse(raw)) return false
      const url = new URL(raw)
      const target = new URL(config.redirectUri)
      if (url.protocol !== target.protocol || url.host !== target.host || url.pathname !== target.pathname) return false
      const pending = state.pending
      const supplied = url.searchParams.getAll("state")
      if (
        !pending ||
        pending.expires < Date.now() ||
        url.hash ||
        url.username ||
        url.password ||
        supplied.length !== 1 ||
        Buffer.byteLength(supplied[0]) !== Buffer.byteLength(pending.state) ||
        !timingSafeEqual(Buffer.from(supplied[0]), Buffer.from(pending.state))
      )
        return true
      state.pending = undefined
      const code = url.searchParams.getAll("code")
      if (url.searchParams.has("error") || code.length !== 1 || !code[0]) return true
      state.epoch++
      state.tokens = undefined
      state.refresh = undefined
      state.profile = undefined
      await persist(undefined, state.epoch)
      await exchange(
        new URLSearchParams({
          grant_type: "authorization_code",
          client_id: config.clientId,
          redirect_uri: config.redirectUri,
          code: code[0],
          code_verifier: pending.verifier,
        }),
        state.epoch,
      )
      state.profile = undefined
      return true
    },
    async status(fresh = false): Promise<AccountState> {
      try {
        await load()
      } catch {
        return { status: "error" }
      }
      if (state.pending && state.pending.expires > Date.now()) return { status: "signing-in" }
      state.pending = undefined
      if (!state.tokens) return { status: "signed-out" }
      try {
        if (fresh || !state.profile || state.profile.checked < Date.now() - 15000) {
          const epoch = state.epoch
          const response = await request(`${config.site}/api/account`, {
            headers: { Authorization: `Bearer ${await token()}` },
            redirect: "error",
            signal: AbortSignal.timeout(15000),
          })
          if (!response.ok) throw new Error("account_unavailable")
          const value = await response.json()
          if (
            !value ||
            typeof value !== "object" ||
            typeof value.id !== "string" ||
            typeof value.email !== "string" ||
            typeof value.displayName !== "string" ||
            !(
              value.accessUntil === null ||
              (typeof value.accessUntil === "string" && Number.isFinite(Date.parse(value.accessUntil)))
            )
          )
            throw new Error("account_invalid")
          if (epoch !== state.epoch) return { status: "signed-out" }
          state.profile = {
            id: value.id,
            email: value.email,
            displayName: value.displayName,
            accessUntil: value.accessUntil,
            checked: Date.now(),
          }
        }
        return {
          status: "signed-in",
          id: state.profile.id,
          email: state.profile.email,
          displayName: state.profile.displayName,
          accessUntil: state.profile.accessUntil,
        }
      } catch {
        return { status: "error" }
      }
    },
    async signOut() {
      await load().catch(() => undefined)
      const access = state.tokens?.access
      state.epoch++
      state.tokens = undefined
      state.loaded = true
      state.pending = undefined
      state.profile = undefined
      state.refresh = undefined
      await persist(undefined, state.epoch)
      if (access)
        await request(`${config.issuer}/auth/v1/logout?scope=local`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access}`,
            apikey: config.publishableKey,
          },
          redirect: "error",
          signal: AbortSignal.timeout(15000),
        }).catch(() => undefined)
    },
  }
}
