# Managed CLI development milestone

The official development entry point is `packages/unlimit-cli/dist/unlimitcode.mjs` (command name `unlimitcode`). It requires Node.js 22.13+ and a locally compiled fork engine. `packages/cli` remains upstream's experimental v2 package and is not the managed product entry point. Release archives, PATH installation, signing and embedded runtime packaging remain separate launch work.

## Build and use

From `packages/unlimit-cli`, run `bun run build --with-engine`. This builds the current checkout's v1 engine with Bun, copies it as `unlimit-engine`, and bundles the Node launcher. It never fetches a prebuilt upstream engine and never uploads a release. Product version comes from `branding/brand.json`; engine compatibility version comes from the pinned upstream tag. Only development builds are accepted. Build this before the desktop, not concurrently: upstream's engine build resets its `dist` directory, which is also used by the desktop build.

Run `node dist/unlimitcode.mjs --help`, `login`, `account`, `account open`, or `logout`. With a verified signed-in paid account, the default command starts the TUI; `run` performs a task and `models` lists account selections. Use an explicit `./project` path when starting outside the project directory. Development Auth still points at the website on `http://127.0.0.1:3210`; a website process must be available there for interactive consent. Do not restart an existing app or server merely to pick up this milestone.

## Login and storage

CLI and desktop share the tested session and Node streaming bridge in `packages/account`. The CLI has a separate public Supabase OAuth client. Its only callback is `http://127.0.0.1:32187/auth/callback`; the listener binds exclusively to IPv4 loopback before opening the system browser. A busy port stops login. Each attempt uses random state and S256 PKCE; wrong hosts, methods, paths, duplicate parameters and replayed callbacks are rejected. No access or refresh token is sent to the browser. Callback responses are private, have no external resources and do not echo codes.

On macOS, a random AES-256-GCM encryption key lives in Keychain. On Linux, the equivalent key uses Secret Service via `secret-tool`. Windows encrypts with current-user DPAPI. Session files are encrypted and replaced atomically under `~/.unlimitcode/cli-dev`; Unix directories/files use 0700/0600. Secrets are piped to OS tools, never passed in arguments, environment variables or logs. There is no plaintext fallback. Logout deletes session ciphertext; the macOS/Linux random encryption key may remain and contains no account information. Linux/WSL without an unlocked Secret Service fails closed; WSL/remote login is not release-supported.

Account reads/refresh/writes are serialized across processes by a heartbeat lock. Each operation reloads persisted credentials; another terminal's logout is therefore visible to the next request. A generation marker prevents pending login from replacing a later logout/login, and commits consume that marker once. Refresh revocation does not invalidate every already-issued Supabase access JWT immediately; an already-started inference request may finish. The gateway independently checks subscription and selected-model access on every request.

## Product boundaries

The engine receives only a random local bridge credential, never the Supabase refresh token or company provider keys. Its managed catalog contains the account's selected, known models. API-key/provider/console/upgrade commands are removed from managed help; TUI connection forms become account guidance. Upstream update checks, sharing and built-in provider-auth plugins are disabled. The managed TUI uses account-specific tips, with no upstream Zen/Go/key-entry offers. Custom agents, project commands and MCP tools remain available; their full live coding acceptance still needs a funded provider.

Selections are loaded when the CLI starts. Reopen a session after changing them on the website. The gateway rejects deselected models immediately even if an older picker still displays one. There is no silent substitution of an explicitly requested model. Headless servers, remote attachment and WSL packaging are not supported by this launcher yet.

## Verification

- `packages/unlimit-cli`: `bun typecheck`, `bun run test`, `bun run build --with-engine`.
- Six tests exercise real loopback HTTP/PKCE, hostile callbacks, expiry/denial, concurrent account operations, independent Node processes, command routing and real OS storage on macOS/Windows. Linux CI skips the OS-store acceptance test.
- Existing desktop session/storage/bridge tests continue through the shared implementation, including upstream streaming cancellation on Node.
- A compiled macOS arm64 engine was run in a temporary profile: it listed only the selected GPT model and hid upstream connection/update commands.
- The private platform's `scripts/hosted-cli-smoke.mjs` passed against dedicated development Supabase: registered-client consent, real loopback PKCE callback, encrypted Keychain persistence, account API, refresh and logout revocation. The temporary user, ciphertext and test Keychain item were removed. This does not substitute for interactive email/browser consent or live paid inference acceptance.

CI runs CLI tests on Linux, macOS and Windows. Future upstream preparation also builds the managed CLI and executes its account checks before a draft integration PR can be published.

References: [Supabase exact OAuth redirect registration](https://supabase.com/docs/guides/auth/oauth-server/getting-started), [Microsoft DPAPI](https://learn.microsoft.com/en-us/dotnet/api/system.security.cryptography.protecteddata), [proper-lockfile](https://github.com/moxystudio/node-proper-lockfile). macOS CLI options were checked against the installed `security` help; Linux behavior follows the [libsecret secret-tool manual](https://manpages.debian.org/trixie/libsecret-tools/secret-tool.1.en.html).
