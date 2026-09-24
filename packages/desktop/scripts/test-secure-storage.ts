// Run the compiled script with Electron, in its own temporary profile, never inside a running app.
import { app, safeStorage } from "electron"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import assert from "node:assert/strict"
import { createTokenStorage } from "../src/managed/storage"

async function main() {
  const root = await mkdtemp(join(tmpdir(), "unlimit-secure-storage-"))
  app.setName("Unlimit Code Storage Test")
  app.setPath("userData", root)
  try {
    await app.whenReady()
    const storage = createTokenStorage(join(root, "account"), {
      available: () =>
        safeStorage.isEncryptionAvailable() &&
        (process.platform !== "linux" || !["basic_text", "unknown"].includes(safeStorage.getSelectedStorageBackend())),
      encrypt: (value) => safeStorage.encryptString(value),
      decrypt: (value) => safeStorage.decryptString(value),
    })
    const tokens = { access: "synthetic-access", refresh: "synthetic-refresh", expires: Date.now() + 3600000 }
    await storage.write(tokens)
    assert.deepEqual(await storage.read(), tokens)
    await storage.write(undefined)
    assert.equal(await storage.read(), undefined)
    console.log(`Native encrypted storage passed on ${process.platform}; synthetic credentials deleted.`)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

main().then(
  () => app.exit(0),
  () => {
    console.error("Native encrypted storage acceptance failed")
    app.exit(1)
  },
)
