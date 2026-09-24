# Current paid software verification — 2026-09-24

The current scope is mandatory account sign-in plus an active software subscription, including personal provider keys and local models. Company-managed inference is removed. Current checks: 110 engine/provider/server tests, 39 app tests, 8 shared account/access/lifecycle tests, 19 desktop session/storage/WSL tests, 6 CLI tests and 12 branding/integration tests passed; package typechecks and desktop/CLI builds passed. The compiled engine rejects missing/unpaid accounts and completes a task against a subscriber's synthetic local provider. Actual account UI signed-out/unpaid/active/revoked/offline states were verified in a separate browser fixture. Platform payment-policy/database/hosted Auth and simulated payment lifecycle checks passed; live merchant acceptance and installed OS acceptance remain pending. See [IMPLEMENTATION_CHECKLIST.md](../IMPLEMENTATION_CHECKLIST.md).

The records below describe earlier implementation phases, including superseded managed inference and optional-profile behavior.

# Initial implementation verification — 2026-09-23

Baseline: upstream v1.18.32 (`545f51d26cc39a907d2867492d498d9607ea5fa4`).

- 802 text targets contain 9,218 transformed prose/display occurrences; 11 explicit checksum-protected overlays cover logos and theme integration. Text rules preserve TypeScript symbols/imports and Markdown code examples/URLs.
- `brand:check` reports zero pending transforms. Reapplying the transform produces no changes. Six tests cover identity preservation, JSX/templates, code examples, idempotence, added/removed occurrences, unknown upstream files, missing targets and changed overlays.
- Full inventory recorded 35,788 remaining case-insensitive matches across 2,758 tracked files at the initial scan. This includes intentionally retained compatibility identifiers and archived upstream code as well as outstanding URL, asset and surface work. The ignored `branding/reports/scan.json` also records binary files and skipped symlinks; binary text is not inferred from a text search.
- UI, app, TUI, CLI engine (`packages/opencode`) and desktop package typechecks passed. The required pre-push hook also completed all 30 workspace typecheck tasks successfully. App production build passed with bundling warnings (mixed dynamic/static imports, duplicated WASM source-map emission and large chunks).
- Four app theme-preload tests passed, covering fresh Paper/Ink defaults and legacy/custom-theme behavior.
- The separate platform passed its production build and typecheck, five streaming gateway tests, and real PostgreSQL policy/lifecycle tests. Hosted Supabase tests verified Auth token validation, account creation, RLS isolation, denied customer subscription writes, model selection and paid-access isolation. Temporary hosted users were removed.
- Browser inspection verified the portal and configured sign-in form. Complete desktop/TUI/native-icon visual review and customer email-link acceptance are still pending.

Supabase local credentials are in ignored, mode-0600 environment files inside the private platform checkout. No provider or service-role secret is in the public application repository. Original font license bytes, including CRLF line endings, are retained.

This evidence does not certify a release. Outstanding acceptance gates are in IMPLEMENTATION_CHECKLIST.md.

## Native account and distribution foundation — 2026-09-23

- Registered a public Supabase OAuth client in the dedicated development project, with dynamic registration disabled. A real hosted smoke test passed PKCE/consent, one-use authorization codes, account API, refresh and refresh-token revocation. The synthetic user was removed. This did not send email or complete an installed-app callback test.
- Six native account/storage tests, three Node bridge tests, 105 engine/config/provider tests, and 35 app catalog/deep-link tests pass. The bridge suite runs in Node to verify the same fetch/stream cancellation behavior used by Electron.
- Real Electron safeStorage on macOS passed encrypted write/read/delete in a temporary profile, with synthetic credentials and cleanup. Windows acceptance remains pending.
- Desktop, app and engine package typechecks pass. A complete desktop build with the fork-built embedded engine passes. The build retains existing upstream bundling warnings; no release package was signed or published.
- The private platform passes 22 unit tests, typecheck and production build. Billing and paid inference remain disabled.
- Approved PNG artwork is packaged into native PNG/ICNS/ICO files with checksums. Owned icons are used for the dock, notifications and HTML favicons. Application IDs, protocol handlers and user-data namespaces are independent from upstream; upstream desktop update feeds are removed and publishing defaults are disabled.
- Native/account changes to upstream files are recorded as explicit checksum-protected overlays. Integration deliberately stops if upstream modifies these files, requiring a reviewed merge before accepting a new baseline. New fork-owned modules remain ordinary maintained source files.

## First-launch follow-up — 2026-09-23

- The development desktop launched with the fork-built embedded engine in an isolated onboarding profile. Clicking the first-launch provider entry exposed “Unlimit Code account”, “Sign in with browser” and “Manage account” in the accessibility tree; no provider-key fields were present. No customer email or login was submitted.
- Visual inspection discovered the V2 layout's separate upstream wordmark, Inter font and provider-tip copy. The V2 wordmark now delegates to the approved shared logo; onboarding and model management use account copy; explicit Paper/Ink V2 surfaces and IBM Plex Mono defaults are supplied. Semantic status, diff and syntax colours are preserved.
- Branding application remains idempotent with 52 checksum-protected overlays. App/UI typechecks, 39 theme/catalog/deep-link tests, settings tests and branding tests pass. The desktop renderer/main/preload rebuild passes.
- The running application was not restarted, per package instructions. The post-fix installed visual review and full browser-to-installed-app callback remain unchecked acceptance gates.

## Private distribution — 2026-09-23

The private platform passes 29 tests including actual local workerd/R2 ranged downloads, publisher-catalog signatures, file digests and paid-access gates. Typechecks, isolated PostgreSQL tests and the production Next.js build pass. Production HTTP checks deny disabled downloads, missing bearer credentials and cross-origin forms; signed-out download pages redirect to login. Hosted Supabase testing passed paid/unpaid isolation and revocation using the production access adapter, then removed both synthetic accounts.

The catalog remains empty and downloads are disabled. No storage resources, signed artifacts, updater integration or public deployment were created. The checked items describe implemented and tested code; hosted distribution and installed update acceptance remain pending.

## Upstream maintenance rehearsals — 2026-09-23

Eleven branding/integration tests pass. Disposable real Git repositories verified a clean merge with branding preserved and a bundled candidate, a conflicting upstream logo, rejection of new automation and branding, and release/downgrade and credential-environment guards. `actionlint` passes for both active workflows. Preparation and draft publication are now separate jobs; only the publisher gets the scoped write credential, and it never executes candidate source. The latest official upstream release remains the pinned v1.18.32. No newer upstream version, live scheduled job, merge to main or signed release was performed.

## Managed CLI milestone — 2026-09-23

The Node development launcher and fork-built macOS arm64 engine pass build and isolated catalog/help smoke checks. Six CLI tests cover real loopback login, denial/expiry, OS encryption, account-generation fencing and independent-process refresh/logout. Shared desktop account/storage (6) and Node bridge/cancellation (3) regressions pass; engine/config/provider tests total 106. TUI, CLI, account, desktop and engine typechecks pass. The website passes 30 tests, typecheck and production build; Electron desktop rebuild passes. Hosted Supabase verifies the actual CLI callback, encrypted Keychain storage, account API, refresh and revocation, with all temporary identities removed. CLI CI passed on Linux, macOS and Windows (run 35835688547), including actual Windows DPAPI. Sixty checksum-protected overlays preserve the latest surfaces. Remaining real browser/email, live inference and release packaging gates are recorded in `CLI_ACCOUNT.md` and the checklist.
