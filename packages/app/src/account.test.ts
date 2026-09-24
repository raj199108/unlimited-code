import { describe, expect, test } from "bun:test"
import { hasAccountAccess } from "./account"

describe("workspace account access", () => {
  test("only a signed-in account with an unexpired paid period opens the workspace", () => {
    const future = new Date(Date.now() + 60000).toISOString()
    expect(hasAccountAccess({ status: "signed-in", accessUntil: future })).toBe(true)
    expect(hasAccountAccess({ status: "signed-out", accessUntil: future })).toBe(false)
    expect(hasAccountAccess({ status: "error", accessUntil: future })).toBe(false)
    expect(hasAccountAccess({ status: "signed-in", accessUntil: null })).toBe(false)
    expect(hasAccountAccess({ status: "signed-in", accessUntil: "invalid" })).toBe(false)
    expect(hasAccountAccess({ status: "signed-in", accessUntil: new Date(Date.now() - 1).toISOString() })).toBe(false)
  })
})
