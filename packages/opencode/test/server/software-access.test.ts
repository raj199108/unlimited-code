import { test, expect } from "bun:test"
import { Effect } from "effect"
import { AppRuntime } from "../../src/effect/app-runtime"
import { Auth } from "../../src/auth"
import { Server } from "../../src/server/server"
import { startAccessServer } from "@unlimitcode/account/access-server"

test("unpaid engine denies workspace data, task admission, terminals and provider credential writes", async () => {
  const previous = {
    UNLIMIT_ACCESS_URL: process.env.UNLIMIT_ACCESS_URL,
    UNLIMIT_ACCESS_SECRET: process.env.UNLIMIT_ACCESS_SECRET,
  }
  const account = await startAccessServer(async () => ({ status: "signed-in", accessUntil: null }))
  Object.assign(process.env, account.environment)
  try {
    for (const [method, path] of [
      ["GET", "/project"],
      ["GET", "/session"],
      ["GET", "/config"],
      ["GET", "/file?path=README.md"],
      ["GET", "/event"],
      ["GET", "/pty/example/connect"],
      ["POST", "/session"],
      ["POST", "/pty"],
      ["PUT", "/auth/test"],
      ["POST", "/provider/test/oauth/authorize"],
    ]) {
      const response = await Server.Default().app.request(path, { method })
      expect(response.status).toBe(402)
    }
    const before = await AppRuntime.runPromise(Effect.flatMap(Auth.Service, (auth) => auth.get("software-access-test")))
    const written = await AppRuntime.runPromise(
      Effect.flatMap(Auth.Service, (auth) =>
        auth.set("software-access-test", { type: "api", key: "synthetic-key" }),
      ).pipe(Effect.exit),
    )
    expect(written._tag).toBe("Failure")
    expect(
      await AppRuntime.runPromise(Effect.flatMap(Auth.Service, (auth) => auth.get("software-access-test"))),
    ).toEqual(before)
    const health = await Server.Default().app.request("/global/health")
    expect(health.status).toBe(200)
  } finally {
    Object.entries(previous).forEach(([key, value]) =>
      value === undefined ? delete process.env[key] : (process.env[key] = value),
    )
    await account.close()
  }
})
