import type { AccountState } from "./types.ts"

export function hasAccess(state: AccountState, now = Date.now()) {
  return state.status === "signed-in" && typeof state.accessUntil === "string" && Date.parse(state.accessUntil) > now
}

export function requireAccess(state: AccountState) {
  if (hasAccess(state)) return
  if (state.status === "signed-out" || state.status === "signing-in") throw new Error("account_signed_out")
  if (state.status === "signed-in") throw new Error("subscription_required")
  throw new Error("account_unavailable")
}
