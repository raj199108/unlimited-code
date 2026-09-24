export type AccountState = {
  status: "unconfigured" | "signed-out" | "signing-in" | "signed-in" | "error"
  id?: string
  email?: string
  displayName?: string
  accessUntil?: string | null
}
