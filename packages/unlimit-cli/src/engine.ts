import type { ManagedModel } from "@unlimitcode/account/types"

export function engineEnvironment(
  bridge: { url: string; key: string },
  models: ManagedModel[],
  environment: NodeJS.ProcessEnv = process.env,
) {
  return {
    ...environment,
    UNLIMIT_MANAGED: "1",
    UNLIMIT_BRIDGE_URL: bridge.url,
    UNLIMIT_BRIDGE_KEY: bridge.key,
    UNLIMIT_SELECTED_MODELS: JSON.stringify(models.map((model) => model.id)),
    OPENCODE_DISABLE_AUTOUPDATE: "1",
    OPENCODE_DISABLE_SHARE: "1",
    OPENCODE_DISABLE_DEFAULT_PLUGINS: "1",
  }
}

export function requireLocalCommand(args: string[]) {
  const allowed = ["run", "models", "agent", "mcp", "export", "import", "stats", "session", "db"]
  const first = args[0]
  if (
    first &&
    !first.startsWith("-") &&
    !allowed.includes(first) &&
    first !== "." &&
    !first.includes("/") &&
    !first.includes("\\")
  )
    throw new Error("cli_command_unavailable")
  if (args.some((arg) => /^(?:--attach|--url|--hostname|--port|--mdns|--mdns-domain|--cors)(?:=|$)/.test(arg)))
    throw new Error("cli_remote_not_supported")
}
