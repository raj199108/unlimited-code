import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { randomUUID } from "node:crypto"
import lockfile from "proper-lockfile"
import { createAccountSession } from "@unlimitcode/account/session"
import type { AccountConfig, TokenStorage, Tokens } from "@unlimitcode/account/session"

export function createCliAccount(config: AccountConfig, storage: TokenStorage, directory: string) {
  const locked = async <T>(action: () => Promise<T>) => {
    await mkdir(directory, { recursive: true, mode: 0o700 })
    const release = await lockfile.lock(directory, {
      lockfilePath: join(directory, "account.lock"),
      stale: 60000,
      update: 5000,
      retries: { retries: 100, minTimeout: 100, maxTimeout: 300, factor: 1 },
    })
    try {
      return await action()
    } finally {
      await release()
    }
  }
  const generationFile = join(directory, "generation")
  const renew = async () => {
    const value = randomUUID()
    await writeFile(generationFile, value, { mode: 0o600 })
    return value
  }
  return {
    token: () => locked(() => createAccountSession(config, storage).token()),
    status: () => locked(() => createAccountSession(config, storage).status()),
    begin: () => locked(renew),
    signOut: () =>
      locked(async () => {
        await renew()
        await createAccountSession(config, storage).signOut()
      }),
    commit: (generation: string, tokens: Tokens) =>
      locked(async () => {
        if ((await readFile(generationFile, "utf8")) !== generation) throw new Error("account_session_changed")
        await createAccountSession(config, storage).signOut()
        await storage.write(tokens)
      }),
  }
}
