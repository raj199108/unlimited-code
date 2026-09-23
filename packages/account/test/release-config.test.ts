import { test } from "node:test"
import assert from "node:assert/strict"
import { releaseAccountConfig } from "../src/release-config.ts"

const config = {
  site: "https://unlimitcode.org",
  issuer: "https://test-project.supabase.co",
  clientId: "test-client-identifier",
  publishableKey: "sb_publishable_test",
  redirectUri: "unlimitcode://auth/callback",
}
test("release builds accept only public HTTPS configuration and exact channel callbacks", () => {
  assert.deepEqual(releaseAccountConfig(config, "prod", "desktop"), config)
  for (const invalid of [
    { ...config, secret: "secret" },
    { ...config, site: "http://localhost:3210" },
    { ...config, redirectUri: "unlimitcode-dev://auth/callback" },
    { ...config, publishableKey: "sb_secret_test" },
    { ...config, site: "https://user:pass@unlimitcode.org" },
  ])
    assert.throws(() => releaseAccountConfig(invalid, "prod", "desktop"))
  assert.throws(() => releaseAccountConfig(config, "beta", "desktop"))
  assert.equal(
    releaseAccountConfig({ ...config, redirectUri: "http://127.0.0.1:32187/auth/callback" }, "prod", "cli").clientId,
    config.clientId,
  )
})
