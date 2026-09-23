import { test } from "node:test"
import assert from "node:assert/strict"
import { engineEnvironment, requireLocalCommand } from "../src/engine.ts"

test("official launcher isolates managed connections, selected models and upstream update/share services", () => {
  const result = engineEnvironment(
    { url: "http://127.0.0.1:2222/v1", key: "ephemeral" },
    [{ id: "openai/gpt-6-astra", name: "GPT-6 Astra", context: 1050000, output: 128000 }],
    { UNLIMIT_MANAGED: "0", UNLIMIT_BRIDGE_URL: "https://evil.invalid" },
  )
  assert.equal(result.UNLIMIT_MANAGED, "1")
  assert.equal(result.UNLIMIT_BRIDGE_URL, "http://127.0.0.1:2222/v1")
  assert.deepEqual(JSON.parse(result.UNLIMIT_SELECTED_MODELS), ["openai/gpt-6-astra"])
  assert.equal(result.OPENCODE_DISABLE_AUTOUPDATE, "1")
  assert.equal(result.OPENCODE_DISABLE_SHARE, "1")
  for (const args of [[], ["run", "code"], ["./project"], ["agent", "create"], ["mcp", "add"]])
    requireLocalCommand(args)
  for (const args of [
    ["providers"],
    ["console", "login"],
    ["upgrade"],
    ["serve"],
    ["run", "--attach=https://evil.invalid"],
  ])
    assert.throws(() => requireLocalCommand(args))
})
