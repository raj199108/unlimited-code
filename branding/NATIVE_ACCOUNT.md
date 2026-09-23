# Native identity and managed account layer

Development desktop builds use the `ai.factso.unlimitcode.dev` identity and `unlimitcode-dev://` scheme. Beta and production identities are reserved separately. The core uses `unlimitcode` data/config/cache/state directories; MDM preferences use `ai.factso.unlimitcode.managed`. Automatic import of OpenCode's legacy Tauri data is disabled. Existing project config filenames, SDK package names, API identifiers and compatibility environment variables remain unchanged.

`brand.json` owns the product version independently from the pinned upstream compatibility version. `native-development.json` contains only public development Auth configuration: issuer URL, OAuth public client ID, publishable key and local website URL. Production configuration is absent, and release packaging stops until the remaining launch gates are implemented.

## Account flow

The main process generates random state and S256 PKCE, opens the system browser, and consumes the exact registered callback. Auth callbacks never enter the renderer's deep-link event stream or logs. Tokens are stored using Electron safeStorage in a private, atomically written `account/session.enc` file. Encryption must be available; Linux's plaintext backend is refused. Refresh requests coalesce; sign-out and account replacement fence late requests so credentials cannot be restored after logout.

Only minimal account state crosses IPC. Provider settings and connect/custom-provider dialogs become account controls. The model picker filters the engine catalog to the account's selected models, refreshing within approximately 30 seconds. Account access is distinct from paid inference permission; the platform checks the current subscription and model selection on every request.

The bundled v1 engine receives an ephemeral loopback bridge URL/key. It is restricted to the Unlimit Code provider and skips other providers' environment/auth loaders. The bridge sends the account bearer token to the fixed platform gateway and preserves streamed bytes, tool-call deltas, errors, cancellation and backpressure. Company OpenRouter keys live only on the platform. Custom project agents, commands and tool settings remain intact. Standalone CLI/TUI development login is implemented in `packages/unlimit-cli` (see `CLI_ACCOUNT.md`); managed WSL/remote-server support and final CLI packaging remain pending; the removed development v2 binary download must not be restored from upstream.

## Native assets and updates

`node branding/generate-native-icons.mjs` packages the approved original PNG into PNG sizes, macOS ICNS and Windows ICO using macOS sips/iconutil. This is a format/size conversion of the same approved image. Generated files and checksums are committed for builds on other operating systems. `copy-icons.ts` copies this owned set into the desktop resources, including the packaged dock icon. Native support/feedback links point to the fork. The upstream GitHub update feeds are removed, the updater is disabled, downgrades are disallowed, and Windows signature verification is enabled.

## Verification and remaining acceptance

Run from package directories:

- `packages/desktop`: `bun test src/managed`, then `node --experimental-strip-types --test test-node/managed-bridge.test.mjs`, then `bun typecheck` and `bun run build`.
- `packages/opencode`: `bun test test/config/unlimit.test.ts test/provider/provider.test.ts` and `bun typecheck`.
- `packages/app`: selected catalog/deep-link tests with its normal Solid preload, plus `bun typecheck`.
- `branding`: `bun test`; `node brand.mjs check` verifies the maintained overlays.

Bridge tests use Node, matching Electron's runtime. Bun 1.3.14 did not propagate a fetch-response abort to the upstream socket in this test; the same test passes with Node 22. The real Node HTTP connection close is asserted. Do not switch the Electron gateway transport to Bun without rerunning that test.

The private platform's `NATIVE_AUTH.md` records hosted Supabase verification of public PKCE, consent, single-use codes, account API, refresh and refresh-token revocation. Real email delivery, installed app handoff, Windows secure-store acceptance, signed installers, paid OpenRouter coding/tool execution, production domain, private downloads and authenticated updater delivery are still pending. The isolated Electron safeStorage smoke test passed on macOS with synthetic credentials and removed its temporary profile. Windows secure storage still needs the same test. Release builds remain disabled.

To run OS storage acceptance, compile `packages/desktop/scripts/test-secure-storage.ts` with Bun for Node/CJS (externalize `electron`), then run the compiled script with Electron. Use a temporary output outside shipping resources; the script creates and deletes its own profile.
