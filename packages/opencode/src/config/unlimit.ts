export * as ConfigUnlimit from "./unlimit"

import type { ConfigV1 } from "@opencode-ai/core/v1/config/config"

// Only the desktop or CLI parent provides this ephemeral local bridge. It is not a provider credential.
export function apply(config: ConfigV1.Info, environment = process.env): ConfigV1.Info {
  if (environment.UNLIMIT_MANAGED !== "1") return config
  const url = environment.UNLIMIT_BRIDGE_URL ?? ""
  const key = environment.UNLIMIT_BRIDGE_KEY ?? ""
  if (!/^http:\/\/127\.0\.0\.1:\d+\/v1$/.test(url) || !/^[\w-]{43}$/.test(key))
    throw new Error("Managed bridge is not configured")
  const selected: unknown = environment.UNLIMIT_SELECTED_MODELS
    ? JSON.parse(environment.UNLIMIT_SELECTED_MODELS)
    : undefined
  const known = ["anthropic/claude-fable-5.1", "openai/gpt-6-astra"]
  if (
    selected !== undefined &&
    (!Array.isArray(selected) || !selected.length || !selected.every((id) => known.includes(id)))
  )
    throw new Error("Managed model selection is invalid")
  const choices = selected as string[] | undefined
  return {
    ...config,
    autoupdate: false,
    share: "disabled",
    autoshare: false,
    enabled_providers: ["unlimitcode"],
    disabled_providers: [],
    provider: {
      unlimitcode: {
        name: "Unlimit Code",
        npm: "@ai-sdk/openai-compatible",
        api: url,
        env: [],
        options: { apiKey: key },
        models: Object.fromEntries(
          Object.entries({
            "anthropic/claude-fable-5.1": {
              name: "Claude Fable 5.1",
              tool_call: true,
              reasoning: true,
              limit: { context: 1000000, output: 128000 },
            },
            "openai/gpt-6-astra": {
              name: "GPT-6 Astra",
              tool_call: true,
              reasoning: true,
              limit: { context: 1050000, output: 128000 },
            },
          }).filter(([id]) => !choices || choices.includes(id)),
        ),
      },
    },
  }
}
