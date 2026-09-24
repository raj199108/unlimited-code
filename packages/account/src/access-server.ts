import { randomBytes, timingSafeEqual } from "node:crypto"
import { createServer } from "node:http"
import { hasAccess } from "@unlimitcode/account/access"
import type { AccountState } from "./types.ts"

// Auth stays in the launcher/main process. This loopback endpoint only answers
// entitlement checks; it never receives model requests or provider credentials.
export async function startAccessServer(status: () => Promise<AccountState>) {
  const secret = randomBytes(32).toString("base64url")
  const server = createServer(async (request, response) => {
    response.setHeader("Cache-Control", "no-store")
    const auth = request.headers.authorization ?? ""
    const expected = `Bearer ${secret}`
    if (
      request.method !== "GET" ||
      request.url !== "/access" ||
      request.headers.origin ||
      Buffer.byteLength(auth) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(auth), Buffer.from(expected))
    ) {
      response.writeHead(403).end()
      return
    }
    const state = await status().catch((): AccountState => ({ status: "error" }))
    if (!hasAccess(state)) {
      response.writeHead(state.status === "signed-in" ? 402 : state.status === "signed-out" ? 401 : 503).end()
      return
    }
    response.setHeader("Content-Type", "application/json")
    response.end(JSON.stringify({ validUntil: Math.min(Date.parse(state.accessUntil!), Date.now() + 5000) }))
  })
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })
  const address = server.address()
  if (!address || typeof address === "string") throw new Error("access_server_unavailable")
  return {
    environment: { UNLIMIT_ACCESS_URL: `http://127.0.0.1:${address.port}/access`, UNLIMIT_ACCESS_SECRET: secret },
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections()
        server.close(() => resolve())
      }),
  }
}
