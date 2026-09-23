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
- [x] Add Paper/Ink application and TUI themes with readable syntax, diffs, and status colours.
- [ ] Isolate application IDs, URL schemes, CLI command, and user-data paths from OpenCode.
- [ ] Replace owned website, support, install, download, telemetry, and update destinations; disable unsupported upstream-owned services.
- [x] Verify repeated branding application is a no-op, missing targets fail, and unexpected new branding fails.
- [ ] Review screenshots of desktop, TUI, website, icons, and installer surfaces in both themes.

## 3. Accounts, subscriptions, and database

- [x] Add Supabase migrations for profiles, model selections, subscriptions, webhook processing, and usage metadata.
- [x] Add RLS and server-only subscription writes; test cross-account access denial.
- [ ] Finish website signup/login, recovery, logout, and account acceptance tests. Email-link login, logout and model-selection pages are implemented; real email delivery and full browser sign-in remain to verify.
- [ ] Implement desktop and CLI browser login, secure token storage, session refresh, and revocation.
- [ ] Integrate Dodo test checkout and customer portal.
- [ ] Verify raw-body webhook signatures, deduplicate events, and reconcile subscription state.
- [ ] Test first payment, delayed/out-of-order events, renewal, cancellation, failed payment, expiry, and refunds.

## 4. Managed models

- [x] Add server-owned catalog for actual selected Claude/GPT model identifiers and capabilities.
- [x] Implement the authenticated streaming gateway with server-held OpenRouter credentials and subscription enforcement. Five gateway tests pass; live inference remains disabled pending verified payments and real-provider testing.
- [ ] Preserve streaming tool calls, reasoning options, cancellation, provider errors, and context limits; never silently change the selected model.
- [ ] Automatically load account selections in the fork and remove customer model-connection/key-entry flows.
- [ ] Preserve custom workflows, agents, and tools independently from managed model connections.
- [ ] Track company usage/cost metadata without storing prompt/code contents by default or implementing customer usage quotas.
- [ ] Test unauthorized requests, cancelled subscriptions, model IDs, stream failures, cancellation, and actual end-to-end coding.

## 5. Website and authenticated distribution

- [ ] Adapt the approved brand kit into landing, model-selection, account, billing, and download pages.
- [ ] Publish relevant branded documentation and accurate product copy.
- [ ] Gate downloads on verified account and subscription state; keep binaries out of public release assets.
- [ ] Implement private-storage delivery and authenticated app-update access, including Range requests and expiry handling.
- [ ] Generate download listings from verified release metadata.
- [ ] Configure Vercel previews, production domains, and private object storage.

## 6. Builds, releases, and upstream maintenance

- [ ] Build all bundled engine/CLI components from the fork revision; avoid upstream-branded executable downloads.
- [ ] Separate product version from upstream compatibility version.
- [ ] Build macOS arm64/x64 and Windows x64/arm64 desktop apps and CLI archives.
- [ ] Configure Apple Developer ID signing/notarization and Windows Authenticode signing; fail production builds when absent.
- [ ] Publish verified artifacts before update metadata, separate beta/stable feeds, and reject invalid signatures/downgrades.
- [x] Archive inherited upstream workflows and add narrowly scoped branding/integration workflows. Scheduled integration still needs its credential and default-branch activation.
- [ ] Check upstream stable releases every six hours and on manual trigger; prepare reviewed integration PRs.
- [ ] Run branding drift checks, package tests/typechecks, builds, and attach integration reports.
- [ ] Rehearse both successful upstream integration and a conflicting update that stops safely.
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
- 2026-09-23: Branding tests and four theme-preload tests pass; UI/app/TUI/engine/desktop typechecks and app production build pass.
- 2026-09-23: Platform build/typecheck, five gateway tests and isolated PostgreSQL policy/lifecycle tests pass. Hosted Supabase Auth/RLS tests pass; both temporary accounts were deleted. Portal and configured sign-in form inspected in the browser.
- 2026-09-23: Dodo, real OpenRouter execution, native account integration, signed downloads, updater delivery and public deployment are not complete. Domain and price/currency remain intentionally deferred.
