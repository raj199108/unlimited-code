import { test } from "node:test"
import assert from "node:assert/strict"
import { setTimeout } from "node:timers/promises"
import { startAccessServer } from "../src/access-server.ts"
import { verifyAccess } from "../src/access-client.ts"
import { hasAccess, requireAccess } from "../src/access.ts"
import type { AccountState } from "../src/types.ts"

test("sign-in alone, invalid dates, expired access and errors cannot unlock BYOK", () => {
  for (const state of [
    { status: "signed-out" },
    { status: "error" },
    { status: "unconfigured" },
    { status: "signed-in" },
    { status: "signed-in", accessUntil: null },
    { status: "signed-in", accessUntil: "invalid" },
    { status: "signed-in", accessUntil: new Date(Date.now() - 1).toISOString() },
  ] satisfies AccountState[]) {
    assert.equal(hasAccess(state), false)
    assert.throws(() => requireAccess(state))
  }
  assert.doesNotThrow(() =>
    requireAccess({ status: "signed-in", accessUntil: new Date(Date.now() + 60000).toISOString() }),
  )
})

test("loopback authority rejects anonymous/browser requests and exposes no tokens or profile", async () => {
  const server = await startAccessServer(async () => ({
    status: "signed-in",
    email: "private@example.invalid",
    accessUntil: new Date(Date.now() + 60000).toISOString(),
  }))
  try {
    assert.equal((await fetch(server.environment.UNLIMIT_ACCESS_URL)).status, 403)
    const headers = { Authorization: `Bearer ${server.environment.UNLIMIT_ACCESS_SECRET}` }
    assert.equal(
      (await fetch(server.environment.UNLIMIT_ACCESS_URL, { headers: { ...headers, Origin: "https://evil.example" } }))
        .status,
      403,
    )
    assert.equal((await fetch(server.environment.UNLIMIT_ACCESS_URL, { method: "POST", headers })).status, 403)
    const body = await (await fetch(server.environment.UNLIMIT_ACCESS_URL, { headers })).json()
    assert.deepEqual(Object.keys(body), ["validUntil"])
    await verifyAccess(server.environment)
  } finally {
    await server.close()
  }
})

test("engine cannot proceed without authority, with a remote authority, or with inactive accounts", async () => {
  await assert.rejects(verifyAccess({}), /subscription_required/)
  await assert.rejects(
    verifyAccess({ UNLIMIT_ACCESS_URL: "https://example.com/access", UNLIMIT_ACCESS_SECRET: "a".repeat(43) }),
  )
  for (const status of ["signed-out", "signed-in", "error"] as const) {
    const server = await startAccessServer(async () => ({ status, accessUntil: null }))
    try {
      await assert.rejects(verifyAccess(server.environment))
    } finally {
      await server.close()
    }
  }
})

test("paid access expires at its paid period, even inside the short verification cache", async () => {
  const accessUntil = new Date(Date.now() + 500).toISOString()
  const server = await startAccessServer(async () => ({ status: "signed-in", accessUntil }))
  try {
    await verifyAccess(server.environment)
    await setTimeout(510)
    await assert.rejects(verifyAccess(server.environment), /subscription_required/)
  } finally {
    await server.close()
  }
})

test("a revoked account or account-service outage is denied on revalidation", async () => {
  const state: { account: AccountState } = {
    account: { status: "signed-in", accessUntil: new Date(Date.now() + 60000).toISOString() },
  }
  const server = await startAccessServer(async () => state.account)
  try {
    await verifyAccess(server.environment)
    state.account = { status: "signed-in", accessUntil: null }
    await setTimeout(5100)
    await assert.rejects(verifyAccess(server.environment))
    state.account = { status: "error" }
    await assert.rejects(verifyAccess(server.environment))
  } finally {
    await server.close()
  }
})
