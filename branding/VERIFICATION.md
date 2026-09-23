# Initial implementation verification — 2026-09-23

Baseline: upstream v1.18.32 (`545f51d26cc39a907d2867492d498d9607ea5fa4`).

- 802 text targets contain 9,218 transformed prose/display occurrences; 11 explicit checksum-protected overlays cover logos and theme integration. Text rules preserve TypeScript symbols/imports and Markdown code examples/URLs.
- `brand:check` reports zero pending transforms. Reapplying the transform produces no changes. Six tests cover identity preservation, JSX/templates, code examples, idempotence, added/removed occurrences, unknown upstream files, missing targets and changed overlays.
- Full inventory recorded 35,788 remaining case-insensitive matches across 2,758 tracked files at the initial scan. This includes intentionally retained compatibility identifiers and archived upstream code as well as outstanding URL, asset and surface work. The ignored `branding/reports/scan.json` also records binary files and skipped symlinks; binary text is not inferred from a text search.
- UI, app, TUI, CLI engine (`packages/opencode`) and desktop package typechecks passed. App production build passed with bundling warnings (mixed dynamic/static imports, duplicated WASM source-map emission and large chunks).
- Four app theme-preload tests passed, covering fresh Paper/Ink defaults and legacy/custom-theme behavior.
- The separate platform passed its production build and typecheck, five streaming gateway tests, and real PostgreSQL policy/lifecycle tests. Hosted Supabase tests verified Auth token validation, account creation, RLS isolation, denied customer subscription writes, model selection and paid-access isolation. Temporary hosted users were removed.
- Browser inspection verified the portal and configured sign-in form. Complete desktop/TUI/native-icon visual review and customer email-link acceptance are still pending.

Supabase local credentials are in ignored, mode-0600 environment files inside the private platform checkout. No provider or service-role secret is in the public application repository. Original font license bytes, including CRLF line endings, are retained.

This evidence does not certify a release. Outstanding acceptance gates are in IMPLEMENTATION_CHECKLIST.md.
