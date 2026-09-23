import { expect, test } from "bun:test"
import { ConfigUnlimit } from "../../src/config/unlimit"

test("managed native configuration preserves workflows but replaces provider connections", () => {
  const config = {
    provider: { openai: { options: { apiKey: "customer-key" } } },
    agent: { build: { prompt: "Custom workflow", tools: { bash: false } } },
    command: { custom: { template: "Do work" } },
  }
  const managed = ConfigUnlimit.apply(config, {
    UNLIMIT_MANAGED: "1",
    UNLIMIT_BRIDGE_URL: "http://127.0.0.1:12345/v1",
    UNLIMIT_BRIDGE_KEY: "a".repeat(43),
  })
  expect(Object.keys(managed.provider!)).toEqual(["unlimitcode"])
  expect(managed.enabled_providers).toEqual(["unlimitcode"])
  expect(managed.agent).toBe(config.agent)
  expect(managed.command).toBe(config.command)
  expect(config.provider.openai.options.apiKey).toBe("customer-key")
  expect(Object.keys(managed.provider!.unlimitcode.models!)).toEqual([
    "anthropic/claude-fable-5.1",
    "openai/gpt-6-astra",
  ])
})

test("an incomplete managed setup fails closed and ordinary CLI config is unchanged", () => {
  const config = { username: "test" }
  expect(ConfigUnlimit.apply(config, {})).toBe(config)
  expect(() => ConfigUnlimit.apply(config, { UNLIMIT_MANAGED: "1" })).toThrow("Managed bridge")
  expect(() =>
    ConfigUnlimit.apply(config, {
      UNLIMIT_MANAGED: "1",
      UNLIMIT_BRIDGE_URL: "https://attacker.invalid/v1",
      UNLIMIT_BRIDGE_KEY: "a".repeat(43),
    }),
  ).toThrow("Managed bridge")
})

test("CLI managed catalog follows selected models while disabling upstream sharing and updates", () => {
  const managed = ConfigUnlimit.apply(
    { autoupdate: true, share: "auto", autoshare: true },
    {
      UNLIMIT_MANAGED: "1",
      UNLIMIT_BRIDGE_URL: "http://127.0.0.1:12345/v1",
      UNLIMIT_BRIDGE_KEY: "a".repeat(43),
      UNLIMIT_SELECTED_MODELS: JSON.stringify(["openai/gpt-6-astra"]),
    },
  )
  expect(Object.keys(managed.provider!.unlimitcode.models!)).toEqual(["openai/gpt-6-astra"])
  expect(managed.autoupdate).toBe(false)
  expect(managed.share).toBe("disabled")
  expect(managed.autoshare).toBe(false)
  for (const selected of ["[]", '["unknown"]', "{}", '"openai/gpt-6-astra"'])
    expect(() =>
      ConfigUnlimit.apply(
        {},
        {
          UNLIMIT_MANAGED: "1",
          UNLIMIT_BRIDGE_URL: "http://127.0.0.1:12345/v1",
          UNLIMIT_BRIDGE_KEY: "a".repeat(43),
          UNLIMIT_SELECTED_MODELS: selected,
        },
      ),
    ).toThrow("Managed model selection is invalid")
})
