import { createServer } from "node:http"
import { timingSafeEqual } from "node:crypto"
import { createAccountSession } from "@unlimitcode/account/session"
import type { AccountConfig, Tokens } from "@unlimitcode/account/session"

export async function startLogin(config: AccountConfig, timeout = 600000) {
  const target = new URL(config.redirectUri)
  if (
    target.protocol !== "http:" ||
    target.hostname !== "127.0.0.1" ||
    !target.port ||
    target.username ||
    target.password ||
    target.search ||
    target.hash
  )
    throw new Error("account_callback_invalid")
  const memory = { tokens: undefined as Tokens | undefined, used: false }
  const session = createAccountSession(config, {
    async read() {
      return memory.tokens
    },
    async write(tokens) {
      memory.tokens = tokens
    },
  })
  const url = new URL(await session.begin())
  const state = url.searchParams.get("state")!
  const result = Promise.withResolvers<Tokens>()
  // The caller attaches its handler after the socket has bound.
  void result.promise.catch(() => undefined)
  const server = createServer(async (request, response) => {
    const send = (status: number, text: string) => {
      response.writeHead(status, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
        "X-Content-Type-Options": "nosniff",
      })
      response.end(text)
    }
    if (
      request.method !== "GET" ||
      request.headers.host !== target.host ||
      !request.url?.startsWith("/") ||
      request.url.startsWith("//") ||
      !URL.canParse(request.url, target)
    )
      return send(400, "Invalid sign-in request.")
    const callback = new URL(request.url, target)
    const supplied = callback.searchParams.getAll("state")
    if (
      callback.origin !== target.origin ||
      callback.pathname !== target.pathname ||
      callback.hash ||
      supplied.length !== 1 ||
      Buffer.byteLength(supplied[0]) !== Buffer.byteLength(state) ||
      !timingSafeEqual(Buffer.from(supplied[0]), Buffer.from(state))
    )
      return send(400, "Invalid sign-in request.")
    if (memory.used) return send(409, "This sign-in request has already been used.")
    const codes = callback.searchParams.getAll("code")
    if (!callback.searchParams.has("error") && (codes.length !== 1 || !codes[0]))
      return send(400, "Invalid sign-in request.")
    memory.used = true
    try {
      await session.callback(callback.toString())
      if (!memory.tokens) throw new Error("account_login_denied")
      send(200, "Unlimit Code sign-in received. Return to your terminal to finish.")
      result.resolve(memory.tokens)
    } catch {
      send(400, "Sign-in could not be completed. Return to your terminal and try again.")
      result.reject(new Error("account_login_failed"))
    }
  })
  server.headersTimeout = 10000
  server.requestTimeout = 15000
  await new Promise<void>((resolve, reject) => {
    server.once("error", () => reject(new Error("account_callback_port_unavailable")))
    server.listen(Number(target.port), "127.0.0.1", resolve)
  })
  const timer = setTimeout(() => result.reject(new Error("account_login_expired")), timeout)
  return {
    url: url.toString(),
    result: result.promise,
    revoke: () => session.signOut(),
    async close() {
      clearTimeout(timer)
      result.reject(new Error("account_login_cancelled"))
      server.closeAllConnections()
      await new Promise<void>((resolve) => server.close(() => resolve()))
    },
  }
}
