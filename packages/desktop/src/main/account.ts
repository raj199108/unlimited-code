import { app, safeStorage, shell } from "electron"
import { join } from "node:path"
import { createAccountSession } from "../managed/session"
import { createTokenStorage } from "../managed/storage"
import type { AccountConfig } from "../managed/session"
import type { AccountPlatform, AccountState } from "@opencode-ai/app/account"
import { startAccessServer } from "@unlimitcode/account/access-server"
import { hasAccess } from "@unlimitcode/account/access"

export function createAccount(config: AccountConfig | null, onAccessLost: () => void) {
  const directory = join(app.getPath("userData"), "account")
  const cipher = {
    available: () =>
      safeStorage.isEncryptionAvailable() &&
      (process.platform !== "linux" || !["basic_text", "unknown"].includes(safeStorage.getSelectedStorageBackend())),
    encrypt: (value: string) => safeStorage.encryptString(value),
    decrypt: (value: Buffer) => safeStorage.decryptString(value),
  }
  const session = config ? createAccountSession(config, createTokenStorage(directory, cipher)) : undefined
  const reading = { pending: undefined as Promise<AccountState> | undefined }
  const status = () => {
    reading.pending ??= (session?.status(true) ?? Promise.resolve<AccountState>({ status: "unconfigured" }))
      .then((state) => {
        if (!hasAccess(state)) onAccessLost()
        return state
      })
      .finally(() => {
        reading.pending = undefined
      })
    return reading.pending
  }
  const platform: AccountPlatform = {
    state: status,
    async signIn() {
      if (!session) return
      await shell.openExternal(await session.begin())
    },
    async signOut() {
      onAccessLost()
      await session?.signOut()
    },
    async openAccount() {
      if (config) await shell.openExternal(`${config.site}/account`)
    },
  }
  return {
    platform,
    startAccessServer: () => startAccessServer(status),
    async callback(url: string) {
      return (await session?.callback(url)) ?? false
    },
  }
}

// Validated at build time; release builds cannot fall back to development Auth.
export function accountConfig(): AccountConfig | null {
  return import.meta.env.UNLIMIT_NATIVE_ACCOUNT as AccountConfig
}
