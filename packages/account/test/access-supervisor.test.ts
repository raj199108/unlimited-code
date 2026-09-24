import { test } from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { once } from "node:events"
import { superviseAccess } from "../src/access-supervisor.ts"
import type { AccountState } from "../src/types.ts"

test("loss of paid access stops the owned process and renewal starts one fresh process", async () => {
  const children: ReturnType<typeof spawn>[] = []
  const start = async () => {
    const child = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { stdio: "ignore" })
    children.push(child)
    await once(child, "spawn")
    return {
      stop: async () => {
        child.kill()
        await once(child, "exit")
      },
    }
  }
  const state: { account: AccountState } = { account: { status: "signed-out" } }
  const owner = superviseAccess(await start(), async () => state.account, start)
  try {
    await owner.check()
    assert.equal(children[0].signalCode, "SIGTERM")
    state.account = { status: "signed-in", accessUntil: null }
    await owner.check()
    assert.equal(children.length, 1)
    state.account = { status: "signed-in", accessUntil: new Date(Date.now() + 60000).toISOString() }
    await Promise.all([owner.check(), owner.check(), owner.check()])
    assert.equal(children.length, 2)
    state.account = { status: "error" }
    await owner.check()
    assert.equal(children[1].signalCode, "SIGTERM")
  } finally {
    await owner.stop()
  }
})

test("shutdown fences an in-flight account refresh before it can restart work", async () => {
  const pending = Promise.withResolvers<AccountState>()
  const state = { stops: 0, starts: 0 }
  const owner = superviseAccess(
    {
      stop: async () => {
        state.stops++
      },
    },
    () => pending.promise,
    async () => {
      state.starts++
      return { stop: async () => {} }
    },
  )
  const checking = owner.check()
  const stopping = owner.stop()
  pending.resolve({ status: "signed-in", accessUntil: new Date(Date.now() + 60000).toISOString() })
  await Promise.all([checking, stopping])
  assert.equal(state.stops, 1)
  assert.equal(state.starts, 0)
})
