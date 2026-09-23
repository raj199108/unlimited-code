import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { randomUUID } from "node:crypto"
import type { Tokens, TokenStorage } from "./session"
export type SecretStorage = { read(): Promise<string | undefined>; write(value: string | undefined): Promise<void> }

export type Cipher = { available(): boolean; encrypt(value: string): Buffer; decrypt(value: Buffer): string }

export function createSecretStorage(directory: string, cipher: Cipher, name = "secret.enc"): SecretStorage {
  const file = join(directory, name)
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
      if (bytes.length > 65536) throw new Error("account_storage_invalid")
      return cipher.decrypt(bytes)
    },
    async write(value) {
      if (!value) return rm(file, { force: true })
      requireCipher()
      await mkdir(directory, { recursive: true, mode: 0o700 })
      const temporary = join(directory, `${randomUUID()}.tmp`)
      try {
        await writeFile(temporary, cipher.encrypt(value), { mode: 0o600, flag: "wx" })
        await rename(temporary, file)
      } finally {
        await rm(temporary, { force: true })
      }
    },
  }
}

export function createTokenStorage(directory: string, cipher: Cipher): TokenStorage {
  const storage = createSecretStorage(directory, cipher, "session.enc")
  return {
    async read() {
      const raw = await storage.read()
      if (!raw) return
      const value = JSON.parse(raw) as Partial<Tokens> | null
      if (
        !value ||
        typeof value.access !== "string" ||
        typeof value.refresh !== "string" ||
        typeof value.expires !== "number" ||
        !Number.isFinite(value.expires)
      )
        throw new Error("account_storage_invalid")
      return value as Tokens
    },
    write: (value) => storage.write(value ? JSON.stringify(value) : undefined),
  }
}
