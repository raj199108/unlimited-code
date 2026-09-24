import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises"
import { execFileSync } from "node:child_process"
import { randomUUID } from "node:crypto"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createOsStorage } from "../src/secure-storage.ts"

test(
  "real OS credential storage encrypts, persists, rejects tampering, and clears synthetic credentials",
  {
    skip: !["darwin", "win32"].includes(process.platform),
  },
  async () => {
    const directory = await mkdtemp(join(tmpdir(), "unlimit-storage-"))
    const service = `ai.factso.unlimitcode.test.${randomUUID()}`
    const storage = createOsStorage(directory, service)
    try {
      assert.equal(await storage.read(), undefined)
      const tokens = {
        access: "synthetic-access-secret",
        refresh: "synthetic-refresh-secret",
        expires: Date.now() + 3600000,
      }
      await storage.write(tokens)
      const bytes = await readFile(join(directory, "session.enc"))
      assert.equal(bytes.includes(Buffer.from(tokens.refresh)), false)
      assert.deepEqual(await createOsStorage(directory, service).read(), tokens)
      if (process.platform !== "win32") assert.equal((await stat(join(directory, "session.enc"))).mode & 0o777, 0o600)
      bytes[bytes.length - 1] ^= 1
      await writeFile(join(directory, "session.enc"), bytes)
      await assert.rejects(storage.read())
      await storage.write(undefined)
      assert.equal(await storage.read(), undefined)
    } finally {
      await rm(directory, { recursive: true, force: true })
      if (process.platform === "darwin")
        execFileSync("/usr/bin/security", ["delete-generic-password", "-s", service, "-a", "session-key-v1"], {
          stdio: "ignore",
        })
    }
  },
)
