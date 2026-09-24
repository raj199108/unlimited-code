# Unlimit Code implementation checklist

Updated: 2026-09-24. Completed means verified; unfinished release prerequisites stay unchecked.

## Current product scope

An independent fork of OpenCode with the approved **Unlimit Code** name and infinity/caret logo, Paper/Ink themes, IBM Plex Mono, isolated application identity, fork-built desktop/CLI distribution, and reviewed upstream maintenance. Users connect their own providers, custom endpoints or local models. Agents, workflows and tools remain supported.

Supabase provides mandatory sign-in, email/display-name profiles, and authoritative paid software access. The $99 USD/month plan is required even for personal keys or local models. Downloads stay free. Managed/company-funded inference is removed. This resolves the earlier ambiguity: removing managed subscriptions did not remove the software subscription.

## Paid software and personal providers

- [x] Preserve all upstream provider/custom/local-model connections, agents, tools and workflows for subscribers.
- [x] Require verified sign-in and a paid period before desktop workspace access and CLI work commands.
- [x] Enforce engine HTTP, credential-write, model-turn and tool-call access checks; no missing-config bypass.
- [x] Keep Auth tokens in secure main/launcher storage; pass only a short-lived loopback access result to the engine.
- [x] Add desktop sidecar stop/recovery and CLI ongoing access checks; final installed-platform acceptance remains below.
- [x] Restore software checkout/portal/signed-webhook reconciliation with an exact $99 USD monthly product, no trial or arbitrary client product.
- [x] Separate historical managed subscriptions from software entitlements; preserve RLS and block user entitlement writes.
- [x] Preserve paid time after cancellation; deny expiry, holds, full refunds, disputes and failed verification.
- [x] Apply the non-destructive software-access migration to dedicated development Supabase and verify real Auth/RLS/isolation/revocation with cleaned-up temporary users.
- [x] Verify compiled engine denies unpaid/missing accounts before provider calls and succeeds with a subscriber's synthetic local model.
- [x] Verify desktop/website builds and package typechecks; 110 engine/provider/server tests, 39 app/provider/theme tests, 8 shared account/lifecycle tests, 19 desktop session/storage/WSL tests, 6 CLI tests, 12 branding/integration tests and 35 platform tests pass. Isolated database lifecycle and hosted native/CLI OAuth tests pass. Real hosted RLS plus simulated signed payment reconciliation, refund/retry/dedup checks pass; actual merchant acceptance remains pending.
- [x] Verify signed-out/unpaid/active/revoked/offline states in the actual account UI using an isolated browser fixture; account page reflects locked access. Protect the new engine boundaries with branding overlays and CI checks.
- [x] Publish updated changes to both existing draft PRs and align descriptions with the paid software/BYOK policy.

## Foundations retained

- [x] Workspace moved to `/Users/rajkumar/unlimited-code`; original files and branding assets preserved.
- [x] Public fork `raj199108/unlimited-code` and private account/distribution repository `raj199108/unlimited-code-platform` created.
- [x] Upstream pinned to v1.18.32; licensing and attribution preserved.
- [x] Deterministic branding scan/application/check tooling, reviewed text targets and protected overlays implemented.
- [x] Approved native icons, Paper/Ink themes, independent application IDs, URL schemes and data paths implemented.
- [x] Desktop engine and development CLI built from fork source; product version separated from upstream version.
- [x] Secure desktop/CLI PKCE, refresh, logout and OS-backed profile token storage implemented.
- [x] Development Supabase project created in factso.ai / US East.
- [x] Public download listings, signed catalogs, checksums, expiring private-storage tickets and CLI installer foundation implemented.
- [x] Upstream integration workflow, isolated publishing credentials, branding checks and real-Git merge rehearsals implemented.

## Remaining release work

- [ ] Finish the remaining name/logo/link audit across shipped surfaces and review both themes in installed apps.
- [ ] Choose the launch domain and configure production Supabase, email delivery, callback URLs and support details.
- [ ] Publish the website and configure production storage/download hosting.
- [ ] Finish bundled CLI runtime/PATH installation and build macOS arm64/x64 and Windows x64/arm64 releases.
- [ ] Configure Apple signing/notarization and Windows signing; verify installed login/storage and coexistence with OpenCode.
- [ ] Publish signed beta artifacts and owned updater feeds; verify upgrade, rollback protection and uninstall behavior.
- [ ] Activate the scheduled upstream workflow on the maintained default branch with its scoped credential; verify a live integration run.
- [ ] Configure the payment merchant, approved recurring product, webhook secrets and reconciliation schedule; verify a real test checkout, renewal, cancellation, refund and native activation before enabling live payments.
- [ ] Run installed macOS/Windows paid-login → provider setup → coding → logout/expiry → renewal acceptance, including active task/terminal teardown and real email delivery. Verify Windows WSL start/stop behavior and replace its remaining upstream installer/runtime references before shipping WSL support.
- [ ] Finalize privacy/operator policies, account support and operational monitoring; promote a verified beta to stable.

Domain remains intentionally undecided. Production payment credentials, subscription acceptance, signing and hosting are launch prerequisites. Company OpenRouter keys and managed model access are not required. Existing development applications and servers were not restarted.
