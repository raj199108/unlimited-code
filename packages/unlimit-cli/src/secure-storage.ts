import { spawn } from "node:child_process"
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import type { SecretStorage } from "@unlimitcode/account/storage"
import type { Tokens, TokenStorage } from "@unlimitcode/account/session"

// Secrets travel only over pipes, never command arguments, environment variables or logs.
async function command(executable: string, args: string[], input = "") {
  return new Promise<{ code: number | null; output: string }>((resolve, reject) => {
    const child = spawn(executable, args, { stdio: ["pipe", "pipe", "pipe"], windowsHide: true })
    const output: Buffer[] = []
    const timeout = setTimeout(() => child.kill(), 20000)
    child.stdout.on("data", (part: Buffer) => output.push(part))
    child.stderr.resume()
    child.stdin.on("error", () => undefined)
    child.once("error", () => {
      clearTimeout(timeout)
      reject(new Error("account_secure_storage_unavailable"))
    })
    child.once("close", (code) => {
      clearTimeout(timeout)
      resolve({ code, output: Buffer.concat(output).toString("utf8").trim() })
    })
    child.stdin.end(input)
  })
}

export function createOsSecretStorage(directory: string, service: string, name = "secret.enc"): SecretStorage {
  if (!/^[a-zA-Z0-9.-]{1,150}$/.test(service)) throw new Error("account_storage_identity_invalid")
  const file = join(directory, name)
  const key = async (create: boolean): Promise<Buffer> => {
    const result =
      process.platform === "darwin"
        ? await command("/usr/bin/security", ["find-generic-password", "-s", service, "-a", "session-key-v1", "-w"])
        : await command("secret-tool", ["lookup", "service", service, "account", "session-key-v1"])
    if (result.code === 0 && /^[a-f0-9]{64}$/.test(result.output)) return Buffer.from(result.output, "hex")
    const missing = process.platform === "darwin" ? result.code === 44 : result.code === 1
    if (!missing || !create) throw new Error("account_secure_storage_unavailable")
    const bytes = randomBytes(32)
    const stored =
      process.platform === "darwin"
        ? await command(
            "/usr/bin/security",
            ["-i"],
            `add-generic-password -s ${service} -a session-key-v1 -w ${bytes.toString("hex")}\n`,
          )
        : await command(
            "secret-tool",
            ["store", "--label=Unlimit Code CLI", "service", service, "account", "session-key-v1"],
            bytes.toString("hex"),
          )
    if (stored.code !== 0) throw new Error("account_secure_storage_unavailable")
    // security's interactive shell may itself exit successfully after a subcommand fails.
    const verified = await key(false)
    if (!verified.equals(bytes)) throw new Error("account_secure_storage_unavailable")
    return verified
  }
  const dpapi = async (bytes: Buffer, operation: "Protect" | "Unprotect") => {
    const script = `Add-Type -AssemblyName System.Security; $b=[Convert]::FromBase64String([Console]::In.ReadToEnd()); $r=[Security.Cryptography.ProtectedData]::${operation}($b,[Text.Encoding]::UTF8.GetBytes('${service}'),[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Convert]::ToBase64String($r))`
    const result = await command(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      bytes.toString("base64"),
    )
    if (result.code !== 0 || !result.output) throw new Error("account_secure_storage_unavailable")
    return Buffer.from(result.output, "base64")
  }
  return {
    async read() {
      const bytes = await readFile(file).catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return undefined
        throw new Error("account_storage_unavailable")
      })
      if (!bytes) return
      if (bytes.length > 65536) throw new Error("account_storage_invalid")
      const clear =
        process.platform === "win32"
          ? await dpapi(bytes, "Unprotect")
          : await (async () => {
              if (bytes[0] !== 1 || bytes.length < 29) throw new Error("account_storage_invalid")
              const cipher = createDecipheriv("aes-256-gcm", await key(false), bytes.subarray(1, 13))
              cipher.setAAD(Buffer.from(service))
              cipher.setAuthTag(bytes.subarray(13, 29))
              return Buffer.concat([cipher.update(bytes.subarray(29)), cipher.final()])
            })()
      return clear.toString("utf8")
    },
    async write(value) {
      if (!value) {
        await rm(file, { force: true })
        // Keep the random OS-protected encryption key; it contains no session or account data.
        return
      }
      const clear = Buffer.from(value)
      const bytes =
        process.platform === "win32"
          ? await dpapi(clear, "Protect")
          : await (async () => {
              const iv = randomBytes(12)
              const cipher = createCipheriv("aes-256-gcm", await key(true), iv)
              cipher.setAAD(Buffer.from(service))
              const encrypted = Buffer.concat([cipher.update(clear), cipher.final()])
              return Buffer.concat([Buffer.from([1]), iv, cipher.getAuthTag(), encrypted])
            })()
      await mkdir(directory, { recursive: true, mode: 0o700 })
      const temporary = join(directory, `${randomBytes(16).toString("hex")}.tmp`)
      try {
        await writeFile(temporary, bytes, { mode: 0o600, flag: "wx" })
        await rename(temporary, file)
      } finally {
        await rm(temporary, { force: true })
      }
    },
  }
}

export function createOsStorage(directory: string, service = "ai.factso.unlimitcode.cli.dev"): TokenStorage {
  const storage = createOsSecretStorage(directory, service, "session.enc")
  return {
    async read() {
      const raw = await storage.read()
      if (!raw) return
      const value: unknown = JSON.parse(raw)
      if (
        !value ||
        typeof value !== "object" ||
        !("access" in value) ||
        typeof value.access !== "string" ||
        !("refresh" in value) ||
        typeof value.refresh !== "string" ||
        !("expires" in value) ||
        typeof value.expires !== "number" ||
        !Number.isFinite(value.expires) ||
        !value.access ||
        !value.refresh
      )
        throw new Error("account_storage_invalid")
      return value as Tokens
    },
    write: (value) => storage.write(value ? JSON.stringify(value) : undefined),
  }
}
