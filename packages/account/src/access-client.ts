const state = { key: "", validUntil: 0, pending: undefined as Promise<void> | undefined }

// Missing configuration is a denial, including direct engine invocation.
export async function verifyAccess(environment: NodeJS.ProcessEnv = process.env) {
  const raw = environment.UNLIMIT_ACCESS_URL ?? ""
  const secret = environment.UNLIMIT_ACCESS_SECRET ?? ""
  if (!URL.canParse(raw) || !/^[A-Za-z0-9_-]{43}$/.test(secret)) throw new Error("subscription_required")
  const url = new URL(raw)
  if (
    url.protocol !== "http:" ||
    url.hostname !== "127.0.0.1" ||
    !url.port ||
    url.pathname !== "/access" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error("subscription_required")
  const key = `${raw}:${secret}`
  if (state.key === key && state.validUntil > Date.now()) return
  if (state.key === key && state.pending) return state.pending
  state.key = key
  state.validUntil = 0
  const pending = (async () => {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${secret}` },
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    })
    if (!response.ok) throw new Error(response.status === 401 ? "account_signed_out" : "subscription_required")
    const value: unknown = await response.json()
    if (
      !value ||
      typeof value !== "object" ||
      !("validUntil" in value) ||
      typeof value.validUntil !== "number" ||
      !Number.isFinite(value.validUntil) ||
      value.validUntil <= Date.now() ||
      value.validUntil > Date.now() + 5000
    )
      throw new Error("subscription_required")
    if (state.key === key) state.validUntil = value.validUntil
  })()
  state.pending = pending
  try {
    await pending
  } finally {
    if (state.pending === pending) state.pending = undefined
  }
}
