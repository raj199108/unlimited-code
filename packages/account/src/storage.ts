import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { randomUUID } from "node:crypto"
import type { Tokens, TokenStorage } from "./session"

export type Cipher = { available(): boolean; encrypt(value: string): Buffer; decrypt(value: Buffer): string }

export function createTokenStorage(directory: string, cipher: Cipher): TokenStorage {
  const file = join(directory, "session.enc")
  const requireCipher = () => {
    if (!cipher.available()) throw new Error("account_secure_storage_unavailable")
  }
  return {
    async read() {
      requireCipher()
      const bytes = await readFile(file).catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return undefined
        throw new Error("account_storage_unavailable")
      })
      if (!bytes) return
      const value: unknown = JSON.parse(cipher.decrypt(bytes))
      if (
        !value ||
        typeof value !== "object" ||
        !("access" in value) ||
        typeof value.access !== "string" ||
        !("refresh" in value) ||
        typeof value.refresh !== "string" ||
        !("expires" in value) ||
        typeof value.expires !== "number" ||
        !Number.isFinite(value.expires)
      )
        throw new Error("account_storage_invalid")
      return value as Tokens
    },
    async write(value) {
      if (!value) return rm(file, { force: true })
      requireCipher()
      await mkdir(directory, { recursive: true, mode: 0o700 })
      const temporary = join(directory, `${randomUUID()}.tmp`)
      try {
        await writeFile(temporary, cipher.encrypt(JSON.stringify(value)), { mode: 0o600, flag: "wx" })
        await rename(temporary, file)
      } finally {
        await rm(temporary, { force: true })
      }
    },
  }
}
