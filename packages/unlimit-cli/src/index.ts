import { spawn } from "node:child_process"
import { homedir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { access } from "node:fs/promises"
const config = __UNLIMIT_ACCOUNT_CONFIG__
const channel = __UNLIMIT_CHANNEL__
import brand from "../../../branding/brand.json"
import { createOsStorage } from "./secure-storage.ts"
import { createCliAccount } from "./account.ts"
import { startLogin } from "./login.ts"
import { engineEnvironment } from "./engine.ts"
import { requireAccess } from "@unlimitcode/account/access"
import { startAccessServer } from "@unlimitcode/account/access-server"

async function openBrowser(url: string) {
  const command =
    process.platform === "darwin"
      ? ["/usr/bin/open", "--", url]
      : process.platform === "win32"
        ? [
            "powershell.exe",
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            "$u=[Console]::In.ReadToEnd(); Start-Process -FilePath $u",
          ]
        : ["xdg-open", url]
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command[0], command.slice(1), { stdio: ["pipe", "ignore", "ignore"], windowsHide: true })
    child.stdin.on("error", () => undefined)
    child.stdin.end(process.platform === "win32" ? url : "")
    child.once("error", () => reject(new Error("cli_browser_unavailable")))
    child.once("exit", (code) => (code === 0 ? resolve() : reject(new Error("cli_browser_unavailable"))))
  })
}

async function main() {
  if (typeof Bun !== "undefined" || Number(process.versions.node.split(".")[0]) < 22)
    throw new Error("cli_node_required")
  const args = process.argv.slice(2)
  if (args.length === 1 && ["--version", "-v"].includes(args[0])) {
    console.log(
      `${brand.name} ${brand.productVersion}${channel === "dev" ? "-dev" : ""} (upstream ${brand.upstream.tag})`,
    )
    return
  }
  if (args.length === 1 && ["--help", "-h"].includes(args[0])) {
    console.log(
      `Unlimit Code\n\n  unlimitcode login          Sign in to your account\n  unlimitcode logout         Sign out of this CLI\n  unlimitcode account        Show your profile\n  unlimitcode account open   Edit your profile in the browser\n  unlimitcode [project]      Start coding\n  unlimitcode run [prompt]   Run a coding task\n  unlimitcode models         List available models\n  unlimitcode auth login     Connect your own provider\n\nConnect providers with /connect in the workspace. Custom models, local models, agents and workflows are supported. Provider usage is billed by your provider; an active Unlimit Code software subscription is required for all workspace use.\n`,
    )
    return
  }
  const directory = join(homedir(), ".unlimitcode", `cli-${channel}`)
  const account = createCliAccount(
    config,
    createOsStorage(directory, `ai.factso.unlimitcode.cli.${channel}`),
    directory,
  )
  if (args[0] === "logout" && args.length === 1) {
    await account.signOut()
    console.log("Signed out of Unlimit Code CLI.")
    return
  }
  if (args[0] === "login" && args.length === 1) {
    const generation = await account.begin()
    const login = await startLogin(config)
    try {
      console.log("Opening Unlimit Code sign-in in your browser…")
      await openBrowser(login.url)
      await account.commit(generation, await login.result).catch(async (error: unknown) => {
        await login.revoke()
        throw error
      })
      console.log(
        "Signed in. An active software subscription is required. Run unlimitcode account open to view access.",
      )
    } finally {
      await login.close()
    }
    return
  }
  if (args[0] === "account") {
    if (args.length === 2 && args[1] === "open") return openBrowser(`${config.site}/account`)
    if (args.length !== 1) throw new Error("cli_command_unavailable")
    const state = await account.status()
    if (state.status === "signed-out") return console.log("Signed out. Run unlimitcode login.")
    if (state.status !== "signed-in") throw new Error("account_unavailable")
    console.log(
      `Unlimit Code account: ${state.email}\nName: ${state.displayName || "—"}\nSoftware access until: ${state.accessUntil || "No active subscription"}`,
    )
    return
  }
  requireAccess(await account.status())
  const engine = fileURLToPath(
    new URL(`./unlimit-engine${process.platform === "win32" ? ".exe" : ""}`, import.meta.url),
  )
  await access(engine).catch(() => {
    throw new Error("cli_engine_missing")
  })
  const accessServer = await startAccessServer(account.status)
  try {
    process.exitCode = await new Promise<number>((resolve, reject) => {
      const child = spawn(engine, args, {
        stdio: "inherit",
        env: { ...engineEnvironment(), ...accessServer.environment },
      })
      const stop = () => child.kill("SIGTERM")
      process.once("SIGINT", stop)
      process.once("SIGTERM", stop)
      child.once("error", () => {
        process.off("SIGINT", stop)
        process.off("SIGTERM", stop)
        reject(new Error("cli_engine_unavailable"))
      })
      child.once("exit", (code) => {
        process.off("SIGINT", stop)
        process.off("SIGTERM", stop)
        resolve(code ?? 1)
      })
    })
  } finally {
    await accessServer.close()
  }
}

const messages: Record<string, string> = {
  subscription_required:
    "An active Unlimit Code software subscription is required, including for your own provider keys. Run unlimitcode account open to subscribe.",
  account_signed_out: "Run unlimitcode login to sign in.",
  account_callback_port_unavailable: "The sign-in callback port is in use. Close the other CLI sign-in and retry.",
  account_secure_storage_unavailable:
    "Secure credential storage is unavailable. Unlock your OS keychain and retry. Linux requires secret-tool and a Secret Service keyring.",
  account_login_failed: "Sign-in was denied or could not complete. Run unlimitcode login to retry.",
  account_login_expired: "Sign-in expired. Run unlimitcode login to retry.",
  account_login_cancelled: "Sign-in cancelled.",
  account_session_changed: "The account changed during sign-in. Run unlimitcode login again.",
  cli_engine_missing: "The fork-built engine is missing. Rebuild this development CLI package.",
  cli_node_required: "This development CLI launcher requires Node.js 22.13 or newer.",
  cli_command_unavailable: "This command is unavailable in Unlimit Code. Run unlimitcode --help.",
  cli_browser_unavailable: "The system browser could not be opened. Check your default browser and retry.",
}
await main().catch((error: unknown) => {
  console.error(
    messages[error instanceof Error ? error.message : ""] ??
      "Unlimit Code could not complete this request. Check your account connection and try again.",
  )
  process.exitCode = 1
})
