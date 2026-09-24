import { expect, test } from "bun:test"
import { ConfigUnlimit } from "../../src/config/unlimit"

test("fork preserves user provider, local model and workflow settings independently of the software access policy", () => {
  const config = {
    model: "local/my-model",
    enabled_providers: ["local", "openrouter"],
    disabled_providers: ["other"],
    provider: {
      local: { api: "http://127.0.0.1:11434/v1", models: { "my-model": { name: "Local" } } },
      openrouter: { options: { apiKey: "synthetic-user-key" } },
    },
    agent: { build: { prompt: "Custom workflow", tools: { bash: false } } },
    command: { custom: { template: "Do work" } },
  }
  const result = ConfigUnlimit.apply(config)
  expect(result.provider).toBe(config.provider)
  expect(result.model).toBe(config.model)
  expect(result.enabled_providers).toBe(config.enabled_providers)
  expect(result.disabled_providers).toBe(config.disabled_providers)
  expect(result.agent).toBe(config.agent)
  expect(result.command).toBe(config.command)
})

test("upstream sharing and package updates remain disabled while retaining the shared config used by plugin hooks", () => {
  const config = { autoupdate: true, share: "auto" as const, autoshare: true }
  expect(ConfigUnlimit.apply(config)).toEqual({ autoupdate: false, share: "disabled", autoshare: false })
  expect(ConfigUnlimit.apply(config)).toBe(config)
})
