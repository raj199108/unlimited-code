export * as ConfigUnlimit from "./unlimit"

import type { ConfigV1 } from "@opencode-ai/core/v1/config/config"

// Only the native parent provides this ephemeral local bridge. It is not a provider credential.
export function apply(config: ConfigV1.Info, environment = process.env): ConfigV1.Info {
  if (environment.UNLIMIT_MANAGED !== "1") return config
  const url = environment.UNLIMIT_BRIDGE_URL ?? ""
  const key = environment.UNLIMIT_BRIDGE_KEY ?? ""
  if (!/^http:\/\/127\.0\.0\.1:\d+\/v1$/.test(url) || !/^[\w-]{43}$/.test(key))
    throw new Error("Managed bridge is not configured")
  return {
    ...config,
    enabled_providers: ["unlimitcode"],
    disabled_providers: [],
    provider: {
      unlimitcode: {
        name: "Unlimit Code",
        npm: "@ai-sdk/openai-compatible",
        api: url,
        env: [],
        options: { apiKey: key },
        models: {
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
        },
      },
    },
  }
}
