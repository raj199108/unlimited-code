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
