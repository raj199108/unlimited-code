import { expect, test } from "bun:test"
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createTokenStorage } from "./storage"

test("storage encrypts, round-trips and deletes tokens; never falls back to plaintext", async () => {
  const root = await mkdtemp(join(tmpdir(), "unlimit-account-"))
  const key = randomBytes(32)
  const state = { available: true }
  const storage = createTokenStorage(root, {
    available: () => state.available,
    encrypt(value) {
      const iv = randomBytes(12)
      const cipher = createCipheriv("aes-256-gcm", key, iv)
      const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
      return Buffer.concat([iv, cipher.getAuthTag(), encrypted])
    },
    decrypt(value) {
      const cipher = createDecipheriv("aes-256-gcm", key, value.subarray(0, 12))
      cipher.setAuthTag(value.subarray(12, 28))
      return Buffer.concat([cipher.update(value.subarray(28)), cipher.final()]).toString("utf8")
    },
  })
  try {
    expect(await storage.read()).toBeUndefined()
    const tokens = { access: "access-private", refresh: "refresh-private", expires: Date.now() }
    await storage.write(tokens)
    expect(await storage.read()).toEqual(tokens)
    expect((await readFile(join(root, "session.enc"))).includes(Buffer.from("private"))).toBe(false)
    if (process.platform !== "win32") expect((await stat(join(root, "session.enc"))).mode & 0o777).toBe(0o600)
    expect(await readdir(root)).toEqual(["session.enc"])
    state.available = false
    await expect(storage.write(tokens)).rejects.toThrow("account_secure_storage_unavailable")
    await expect(storage.read()).rejects.toThrow("account_secure_storage_unavailable")
    await storage.write(undefined)
    expect(await readdir(root)).toEqual([])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
