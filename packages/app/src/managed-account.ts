export type ManagedModel = { id: string; name: string; context: number; output: number }
export type ManagedAccountState = {
  status: "unconfigured" | "signed-out" | "signing-in" | "signed-in" | "error"
  email?: string
  paid?: boolean
  models?: ManagedModel[]
}
export type ManagedAccountPlatform = {
  state(): Promise<ManagedAccountState>
  signIn(): Promise<void>
  signOut(): Promise<void>
  openAccount(): Promise<void>
}
