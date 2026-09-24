export type AccountState = {
  status: "unconfigured" | "signed-out" | "signing-in" | "signed-in" | "error"
  email?: string
  id?: string
  displayName?: string
  accessUntil?: string | null
}
export function hasAccountAccess(state: AccountState) {
  return (
    state.status === "signed-in" && typeof state.accessUntil === "string" && Date.parse(state.accessUntil) > Date.now()
  )
}
export type AccountPlatform = {
  state(): Promise<AccountState>
  signIn(): Promise<void>
  signOut(): Promise<void>
  openAccount(): Promise<void>
}
