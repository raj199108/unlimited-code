import type { AccountConfig } from "./session"

// Public build metadata only. Reject arbitrary extra fields so secrets cannot enter installers.
export function releaseAccountConfig(
  value: unknown,
  channel: "beta" | "prod",
  client: "desktop" | "cli",
): AccountConfig {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Release account configuration required")
  const input = value as Record<string, unknown>
  const fields = ["issuer", "clientId", "redirectUri", "site", "publishableKey"]
  if (Object.keys(input).some((key) => !fields.includes(key)) || fields.some((key) => typeof input[key] !== "string"))
    throw new Error("Release configuration must contain only public account fields")
  const config = input as AccountConfig
  for (const origin of [config.issuer, config.site]) {
    if (!URL.canParse(origin)) throw new Error("Invalid release origin")
    const url = new URL(origin)
    if (
      url.protocol !== "https:" ||
      url.origin !== origin ||
      url.username ||
      url.password ||
      !/^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname) ||
      /\.(test|invalid|example|localhost)$/.test(url.hostname)
    )
      throw new Error("Release origins must be canonical public HTTPS origins")
  }
  const redirect =
    client === "cli"
      ? "http://127.0.0.1:32187/auth/callback"
      : `unlimitcode${channel === "beta" ? "-beta" : ""}://auth/callback`
  if (
    config.redirectUri !== redirect ||
    !/^[a-zA-Z0-9_-]{10,200}$/.test(config.clientId) ||
    !/^sb_publishable_[a-zA-Z0-9_-]+$/.test(config.publishableKey)
  )
    throw new Error("Release OAuth client or publishable key is invalid")
  return config
}
