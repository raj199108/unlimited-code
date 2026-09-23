# Unlimit Code implementation checklist

Updated: 2026-09-23. Check an item only when its acceptance criteria have been verified. Unchecked items are not complete. Record external prerequisites explicitly instead of marking them complete.

## Agreed product

- Display brand: **Unlimit Code**, preserving the approved first infinity/caret icon, Paper `#fdfcfc`, Ink `#201d1d`, and IBM Plex Mono.
- Workspace: `/Users/rajkumar/unlimited-code`; fork owner: `raj199108`; author email: `raj@facts.ai`.
- Managed model connections only: no customer model-provider API key entry. Keep custom agents, workflows, tools, and project functionality.
- Account and active paid subscription required for official downloads and managed inference. Public fork source remains public.
- Supabase Auth + Postgres; Dodo monthly bundle; company-funded **actual selected models** through OpenRouter. No customer message credits or daily usage quotas.
- Vercel website/API; private object storage for downloads; independent macOS/Windows signing and update feeds.
- Domain and monthly price/currency: intentionally deferred. Live sales and production promotion stay disabled until configured.

## 1. Workspace and repositories

- [x] Move the existing workspace and preserve all original files. Evidence: `output/workspace-migration.json` records verified SHA-256 hashes for 19 original files; old path is a compatibility symlink.
- [x] Archive the six externally stored branding-generation images inside the workspace without deleting the originals.
- [x] Create or verify `raj199108/unlimited-code` as a fork of `anomalyco/opencode` using the selected account.
- [x] Establish the pinned upstream baseline, maintained `main` branch, and `codex/brand-foundation` implementation branch.
- [x] Preserve upstream licensing, brand/font licenses, and attribution.
- [x] Establish the separate private platform repository: `raj199108/unlimited-code-platform`; nested local checkout is ignored by the public fork.

## 2. Branding and compatibility

- [x] Add a canonical brand manifest and approved asset sources.
- [x] Implement deterministic `brand:scan`, `brand:apply`, and `brand:check` with documented compatibility exceptions and failure on unknown drift.
- [ ] Replace shipped names, logos, icons, banners, installer metadata, native menus, and localization copy.
- [x] Package the approved original icon as macOS ICNS, Windows ICO and native PNG resources; verify checksums and compile the desktop with owned metadata and notification artwork.
- [x] Add Paper/Ink application and TUI themes with readable syntax, diffs, and status colours.
- [x] Replace the newer desktop layout’s separate wordmark and provider onboarding copy; apply Paper/Ink surfaces and IBM Plex Mono to its theme tokens. Source/typecheck/build verification is complete; final visual acceptance remains below.
- [ ] Isolate application IDs, URL schemes, CLI command, and user-data paths from OpenCode.
- [x] Isolate desktop application IDs/schemes, core user-data/config/cache/state directories and managed preferences; remove automatic legacy OpenCode data migration. Standalone CLI naming remains pending.
- [x] Remove upstream desktop update feeds, disable updating until private delivery is ready, disallow downgrades and require Windows update signature verification.
- [ ] Replace owned website, support, install, download, telemetry, and update destinations; disable unsupported upstream-owned services.
- [x] Verify repeated branding application is a no-op, missing targets fail, and unexpected new branding fails.
- [ ] Review screenshots of desktop, TUI, website, icons, and installer surfaces in both themes.

## 3. Accounts, subscriptions, and database

- [x] Add Supabase migrations for profiles, model selections, subscriptions, webhook processing, and usage metadata.
- [x] Add RLS and server-only subscription writes; test cross-account access denial.
- [ ] Finish website signup/login, recovery, logout, and account acceptance tests. Email-link login, logout and model-selection pages are implemented; real email delivery and full browser sign-in remain to verify.
- [ ] Implement desktop and CLI browser login, secure token storage, session refresh, and revocation.
- [x] Implement desktop browser PKCE, consent, account-only IPC, encrypted-storage adapter, refresh coalescing and logout fencing; verify real hosted OAuth/account API/refresh revocation with a temporary user and remove the user.
- [x] Verify the encrypted-token adapter against real Electron safeStorage on macOS in an isolated profile; synthetic credentials and profile removed.
- [x] Launch the development desktop in an isolated onboarding profile and verify that the provider entry opens signed-out account controls through the accessibility tree, with no provider-key form.
- [ ] Verify installed macOS/Windows browser callback, Windows credential storage and real email delivery; implement standalone CLI login.
- [x] Implement account-bound Dodo test-checkout/customer-portal routes with fixed server product, checkout reuse, and disabled-by-default billing. Verified with the official SDK, simulated provider responses and real hosted Supabase.
- [x] Verify raw-body signatures, deduplicate events, and atomically reconcile current subscription/payment state with database leases and stale-worker protection.
- [x] Test mandate versus payment, renewal-period matching, delayed events, retries, cancellation, holds/expiry, refunds, cross-account access and payment-reuse denial using unit/PostgreSQL tests and a hosted Supabase smoke test.
- [x] Add a manual reconciliation/recovery command and billing configuration runbook.
- [ ] Configure Dodo test merchant/product/webhook credentials and verify real checkout, customer portal, signed deliveries and the full payment lifecycle. Simulated provider responses do not complete this acceptance gate.
- [ ] Verify actual Dodo payment-to-period timestamps, adaptive currency behavior and completed/expired checkout replacement before enabling purchases.
- [ ] Deploy scheduled billing reconciliation and event-lag/failure alerts.

## 4. Managed models

- [x] Add server-owned catalog for actual selected Claude/GPT model identifiers and capabilities.
- [x] Implement the authenticated streaming gateway with server-held OpenRouter credentials and subscription enforcement. Five gateway tests pass; live inference remains disabled pending verified payments and real-provider testing.
- [ ] Preserve streaming tool calls, reasoning options, cancellation, provider errors, and context limits; never silently change the selected model.
- [ ] Automatically load account selections in the fork and remove customer model-connection/key-entry flows.
- [x] Wire the development desktop to the managed gateway through a private loopback bridge; replace provider-key forms with account controls and filter the picker to account-selected models. Verify routing, streaming, cancellation, key exclusion and selection filtering in tests.
- [ ] Preserve custom workflows, agents, and tools independently from managed model connections.
- [ ] Track company usage/cost metadata without storing prompt/code contents by default or implementing customer usage quotas.
- [ ] Test unauthorized requests, cancelled subscriptions, model IDs, stream failures, cancellation, and actual end-to-end coding.

## 5. Website and authenticated distribution

- [ ] Adapt the approved brand kit into landing, model-selection, account, billing, and download pages.
- [ ] Publish relevant branded documentation and accurate product copy.
- [ ] Gate downloads on verified account and subscription state; keep binaries out of public release assets.
- [ ] Implement private-storage delivery and authenticated app-update access, including Range requests and expiry handling.
- [ ] Generate download listings from verified release metadata.
- [x] Implement verified-account/paid-access download gates, same-origin forms and native JSON link requests; validate hosted Supabase account isolation and immediate revocation of new links.
- [x] Implement private R2 delivery through a download Worker with five-minute scoped tickets, GET/HEAD, single byte ranges and expiry checks; pass local workerd/R2 integration tests.
- [x] Implement publisher-signed catalog validation, sequence rollback protection, catalog-driven installer listings and a local SHA-256/SHA-512/size verifier. Signed installer production and hosted storage acceptance remain pending.
- [ ] Configure Vercel previews, production domains, and private object storage.

## 6. Builds, releases, and upstream maintenance

- [ ] Build all bundled engine/CLI components from the fork revision; avoid upstream-branded executable downloads.
- [x] Build the desktop's embedded v1 engine from the fork and remove the upstream development v2 executable download/launch path. CLI and WSL packaging remain pending.
- [ ] Separate product version from upstream compatibility version.
- [x] Source desktop display/package version from the brand manifest independently of upstream engine compatibility version; beta/production packaging remains explicitly disabled.
- [ ] Build macOS arm64/x64 and Windows x64/arm64 desktop apps and CLI archives.
- [ ] Configure Apple Developer ID signing/notarization and Windows Authenticode signing; fail production builds when absent.
- [ ] Publish verified artifacts before update metadata, separate beta/stable feeds, and reject invalid signatures/downgrades.
- [x] Archive inherited upstream workflows and add narrowly scoped branding/integration workflows. Scheduled integration still needs its credential and default-branch activation.
- [ ] Check upstream stable releases every six hours and on manual trigger; prepare reviewed integration PRs.
- [ ] Run branding drift checks, package tests/typechecks, builds, and attach integration reports.
- [x] Rehearse clean and conflicting upstream merges in disposable real Git repositories; verify branded overlays, bundle creation and safe stops on new workflows/branding. A real newer upstream release and live scheduled run remain pending.
- [x] Separate upstream preparation from draft publication so candidate dependency/build code never receives the publishing secret; validate candidate ancestry and unchanged automation again before the fixed-branch push.
- [ ] Verify install, coexistence with OpenCode, and upgrade from an earlier Unlimit Code build on supported platforms.

## 7. Production launch gates

- [ ] Supply launch domain and monthly price/currency.
- [x] Create the dedicated Supabase development project in **factso.ai / US East**: `unlimit-code-dev` (`akonegyrvrjhgrmpzgbd`); apply migrations and verify hosted Auth/RLS with temporary accounts.
- [ ] Configure a separate production Supabase project, production login providers, and email delivery.
- [ ] Supply Dodo product/live credentials, funded OpenRouter credentials, signing identities, and hosting/storage credentials.
- [ ] Complete signup → verified payment → download → app login → actual model/tool execution acceptance test.
- [ ] Verify monitoring for payment-event lag, download/update failures, inference availability, and company spending.
- [ ] Promote a verified beta to the first stable release through reviewed deployment.

## Implementation log

- 2026-09-23: Workspace moved and original-file checksums verified; fork and private platform repository created.
- 2026-09-23: Applied 9,218 display/prose replacements across 802 targets plus 11 explicit overlays. Wider scan still reports technical identifiers, upstream compatibility references, URLs, and unconverted surfaces; this is not a completed full rebrand.
- 2026-09-23: Branding tests and four theme-preload tests pass; all 30 workspace typechecks and app production build pass.
- 2026-09-23: Platform build/typecheck, five gateway tests and isolated PostgreSQL policy/lifecycle tests pass. Hosted Supabase Auth/RLS tests pass; both temporary accounts were deleted. Portal and configured sign-in form inspected in the browser.
- 2026-09-23: Dodo, real OpenRouter execution, native account integration, signed downloads, updater delivery and public deployment are not complete. Domain and price/currency remain intentionally deferred.
- 2026-09-23: Added test-mode billing routes, raw-body verification, event deduplication, fenced reconciliation, refund/dispute handling, checkout reuse and recovery tooling. All 20 unit tests, PostgreSQL account/billing checks, typecheck and production build pass. Billing migration applied to development Supabase; hosted Auth/Postgres billing smoke passed with simulated Dodo responses, and both temporary accounts plus test metadata were removed. Actual Dodo merchant acceptance and production billing remain pending; live mode is rejected.
- 2026-09-23: Enabled hosted Supabase OAuth with dynamic registration disabled; registered/reused a public development desktop client. Hosted PKCE, consent, one-use codes, verified account API, refresh and logout revocation pass. Added native account/bridge integration, managed provider restriction, identity isolation, approved native icons and release guards. These code checks do not complete real email, installed-app, Windows/macOS signing, private distribution or paid inference acceptance. See `branding/NATIVE_ACCOUNT.md` and private platform `NATIVE_AUTH.md`.

- 2026-09-23: Desktop first-launch inspection found a separate V2 wordmark/font and provider-tip surface. Replaced those surfaces, preserved model-management controls and added five reviewed overlays (52 total). The running app was not restarted; final appearance acceptance of the rebuilt application remains pending.

- 2026-09-23: Private distribution implementation passes 29 tests, website/Worker typechecks, isolated PostgreSQL checks, production build and HTTP fail-closed checks. Hosted download access smoke verified two-account isolation and revocation, then removed both accounts. No R2 bucket, public Worker, signed release or download capability was published. See private platform `DISTRIBUTION.md`.

- 2026-09-23: Eleven branding/integration tests pass, including real-Git clean/conflict rehearsals and credential-environment isolation. The two-job upstream workflow passes actionlint and adds app/desktop builds plus managed-provider checks. Latest official upstream stable is still v1.18.32. Schedule activation, scoped publishing credential and a live integration run remain pending; see `branding/UPSTREAM_MAINTENANCE.md`.

- Review branches are pushed. Draft changes: [application branding](https://github.com/raj199108/unlimited-code/pull/1) and [private account platform](https://github.com/raj199108/unlimited-code-platform/pull/1). Neither PR represents a finished production release.
