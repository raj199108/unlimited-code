export type AccountState = {
  status: "unconfigured" | "signed-out" | "signing-in" | "signed-in" | "error"
  email?: string
  id?: string
  displayName?: string
}
export type AccountPlatform = {
  state(): Promise<AccountState>
  signIn(): Promise<void>
  signOut(): Promise<void>
  openAccount(): Promise<void>
}
