import { app, safeStorage, shell } from "electron"
import { join } from "node:path"
import { CHANNEL } from "./constants"
import { createAccountSession } from "../managed/session"
import { createTokenStorage } from "../managed/storage"
import type { AccountConfig } from "../managed/session"
import type { ManagedAccountPlatform, ManagedAccountState } from "@opencode-ai/app/managed-account"

export function createManagedAccount(config: AccountConfig | null) {
  const session = config
    ? createAccountSession(
        config,
        createTokenStorage(join(app.getPath("userData"), "account"), {
          available: () =>
            safeStorage.isEncryptionAvailable() &&
            (process.platform !== "linux" ||
              !["basic_text", "unknown"].includes(safeStorage.getSelectedStorageBackend())),
          encrypt: (value) => safeStorage.encryptString(value),
          decrypt: (value) => safeStorage.decryptString(value),
        }),
      )
    : undefined
  const reading = { pending: undefined as Promise<ManagedAccountState> | undefined }
  const platform: ManagedAccountPlatform = {
    state: () => {
      reading.pending ??= (
        session?.status() ?? Promise.resolve<ManagedAccountState>({ status: "unconfigured" })
      ).finally(() => {
        reading.pending = undefined
      })
      return reading.pending
    },
    async signIn() {
      if (!session) return
      await shell.openExternal(await session.begin())
    },
    async signOut() {
      await session?.signOut()
    },
    async openAccount() {
      if (config) await shell.openExternal(`${config.site}/account`)
    },
  }
  return {
    platform,
    token: () => session?.token() ?? Promise.reject(new Error("account_unconfigured")),
    async callback(url: string) {
      return (await session?.callback(url)) ?? false
    },
  }
}

// Build-time configuration only. Beta/production cannot accidentally use local development Auth.
export function managedConfig(): AccountConfig | null {
  if (CHANNEL !== "dev") return null
  return import.meta.env.UNLIMIT_NATIVE_DEVELOPMENT as AccountConfig
}
