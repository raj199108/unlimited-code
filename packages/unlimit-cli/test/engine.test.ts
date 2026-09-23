import { test } from "node:test"
import assert from "node:assert/strict"
import { engineEnvironment } from "../src/engine.ts"

test("launcher preserves user provider settings and protects fork updates without an account gateway", () => {
  const input = { OPENAI_API_KEY: "synthetic", OPENCODE_CONFIG: "/tmp/project-config.json" }
  const result: NodeJS.ProcessEnv = engineEnvironment(input)
  assert.equal(result.OPENAI_API_KEY, input.OPENAI_API_KEY)
  assert.equal(result.OPENCODE_CONFIG, input.OPENCODE_CONFIG)
  assert.equal(result.OPENCODE_DISABLE_AUTOUPDATE, "1")
  assert.equal(result.OPENCODE_DISABLE_SHARE, "1")
  assert.equal(result.OPENCODE_DISABLE_DEFAULT_PLUGINS, undefined)
  assert.equal(result.UNLIMIT_MANAGED, undefined)
  assert.equal(result.UNLIMIT_BRIDGE_URL, undefined)
})
