import { createServer } from "node:http"
import { randomBytes, timingSafeEqual } from "node:crypto"
import { Readable } from "node:stream"
import type { ReadableStream } from "node:stream/web"
import { pipeline } from "node:stream/promises"

export async function startManagedBridge(site: string | undefined, token: () => Promise<string>) {
  const key = randomBytes(32).toString("base64url")
  const server = createServer(async (request, response) => {
    const reject = (status: number, code: string) => {
      response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" })
      response.end(JSON.stringify({ error: { code } }))
    }
    const supplied = request.headers.authorization ?? ""
    const expected = `Bearer ${key}`
    if (
      Buffer.byteLength(supplied) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
    )
      return reject(401, "unauthorized")
    if (request.method !== "POST" || request.url !== "/v1/chat/completions") return reject(404, "not_found")
    if (!site) return reject(503, "account_unconfigured")
    if (!request.headers["content-type"]?.startsWith("application/json")) return reject(415, "invalid_content_type")
    const abort = new AbortController()
    const timeout = setTimeout(() => abort.abort(), 240000)
    request.once("aborted", () => abort.abort())
    response.once("close", () => {
      if (!response.writableEnded) abort.abort()
    })
    try {
      const chunks: Buffer[] = []
      const size = { bytes: 0 }
      for await (const chunk of request) {
        size.bytes += chunk.length
        if (size.bytes > 2097152) return reject(413, "request_too_large")
        chunks.push(chunk)
      }
      const access = await token().catch(() => undefined)
      if (!access) return reject(401, "account_signed_out")
      const upstream = await fetch(`${site}/api/v1/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
        body: Buffer.concat(chunks),
        signal: abort.signal,
        redirect: "error",
      })
      response.writeHead(upstream.status, {
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      })
      if (!upstream.body) {
        response.end()
        return
      }
      // Node and DOM type libraries describe the same Web Stream with different generic variance.
      await pipeline(Readable.fromWeb(upstream.body as unknown as ReadableStream), response, { signal: abort.signal })
    } catch {
      if (!response.headersSent && !response.destroyed) reject(502, "managed_gateway_unavailable")
      if (!response.writableEnded && !response.destroyed) response.destroy()
    } finally {
      clearTimeout(timeout)
    }
  })
  server.requestTimeout = 30000
  server.headersTimeout = 10000
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject)
      resolve()
    })
  })
  const address = server.address()
  if (!address || typeof address === "string") throw new Error("managed_bridge_unavailable")
  return {
    url: `http://127.0.0.1:${address.port}/v1`,
    key,
    async close() {
      server.closeAllConnections()
      await new Promise<void>((resolve) => server.close(() => resolve()))
    },
  }
}
