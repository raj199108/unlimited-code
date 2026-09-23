import { readFile, writeFile, rm } from "node:fs/promises"
import { join } from "node:path"
import { createCliAccount } from "../../src/account.ts"
const directory = process.argv[2]
const config = JSON.parse(await readFile(join(directory, "config.json"), "utf8"))
const storage = {
  async read() {
    const value = await readFile(join(directory, "synthetic.json"), "utf8").catch((error) => {
      if (error.code !== "ENOENT") throw error
    })
    return value ? JSON.parse(value) : undefined
  },
  async write(value) {
    if (!value) return rm(join(directory, "synthetic.json"), { force: true })
    await writeFile(join(directory, "synthetic.json"), JSON.stringify(value), { mode: 0o600 })
  },
}
const account = createCliAccount(config, storage, directory)
try {
  if (process.argv[3] === "logout") await account.signOut()
  if (process.argv[3] === "token") await account.token()
} catch {
  process.exitCode = 1
}
