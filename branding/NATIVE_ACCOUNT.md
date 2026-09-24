# Desktop account and subscription gate

Before activation, the renderer shows only account controls: sign up/sign in, profile/subscription management, retry and logout. A verified, unexpired software subscription mounts the workspace and its provider settings. Both layouts retain separate Account and Providers settings. Users provide their own model access.

The main process owns PKCE, refresh, callback validation and OS-encrypted tokens. Renderer IPC exposes profile and access expiry only, validates the window main frame, and never exposes Auth tokens. The account service and engine independently deny unverified access. The main process stops the sidecar when account access ends and recreates it on the same local URL once verified access returns; provider credentials remain local.

Development uses `native-development.json` and `unlimitcode-dev://auth/callback`. Release builds require approved public HTTPS account configuration and exact channel callbacks. Identity, data paths and native icons remain isolated from upstream.

Verify from `packages/desktop` using `bun test src/managed`, `bun typecheck`, and `bun run build`. Shared entitlement transport tests live in `packages/account`; HTTP/credential denial tests live in `packages/opencode/test/server/software-access.test.ts`. The historical `src/managed` folder holds profile-session re-exports, not managed inference. Installed macOS/Windows lifecycle acceptance, signing and release feeds remain in the [checklist](../IMPLEMENTATION_CHECKLIST.md).
