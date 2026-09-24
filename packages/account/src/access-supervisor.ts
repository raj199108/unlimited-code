import { hasAccess } from "@unlimitcode/account/access"
import type { AccountState } from "./types"

type Process = { stop(): Promise<void> }

// Own the process lifetime independently of renderer polling. Serializing checks
// prevents a slow refresh/start from resurrecting a process after shutdown.
export function superviseAccess(initial: Process, status: () => Promise<AccountState>, start: () => Promise<Process>) {
  const state = {
    current: initial as Process | undefined,
    closed: false,
    pending: undefined as Promise<void> | undefined,
  }
  const halt = async () => {
    await state.current?.stop()
    state.current = undefined
  }
  const check = () => {
    if (state.closed) return Promise.resolve()
    if (state.pending) return state.pending
    const pending = (async () => {
      const account = await status().catch((): AccountState => ({ status: "error" }))
      if (state.closed) return
      if (!hasAccess(account)) return halt()
      if (state.current) return
      const next = await start()
      if (state.closed) return next.stop()
      state.current = next
    })().finally(() => {
      if (state.pending === pending) state.pending = undefined
    })
    state.pending = pending
    return pending
  }
  const timer = setInterval(() => void check().catch(() => undefined), 5000)
  return {
    check,
    async stop() {
      state.closed = true
      clearInterval(timer)
      await state.pending?.catch(() => undefined)
      await halt()
    },
  }
}
