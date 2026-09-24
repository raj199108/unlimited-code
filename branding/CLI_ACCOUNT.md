# CLI sign-in and paid access

`unlimitcode login` uses public PKCE in the browser. `unlimitcode account` shows profile and software-access expiry; `account open` opens profile/subscription management; `logout` revokes the local session. Help and version are available without payment. Every workspace/provider command requires a verified active software subscription before the fork-built engine starts.

Users connect their own providers through `/connect` or `auth login`. Provider environment variables, custom endpoints, model choices, local models, plugins, agents and workflows remain supported after software activation. Provider usage is billed separately.

A loopback access authority lives in the launcher. Only its random-secret URL is passed to the engine, not Supabase tokens. The engine also checks access and exits on loss of access. Direct engine invocation without the authority is denied. Auth tokens use macOS Keychain, Windows DPAPI or Linux Secret Service with no plaintext fallback. Existing refresh/logout generation fencing and process locks remain.

Verification: run `bun typecheck`, `bun run test`, `bun run build --with-engine`, then `node --experimental-strip-types script/smoke.mjs` from `packages/unlimit-cli`. The smoke test uses a synthetic local model and proves denied accounts make no model requests while paid access succeeds. It does not incur provider charges. Signed cross-platform release acceptance remains pending; see [RELEASES.md](../packages/unlimit-cli/RELEASES.md).
