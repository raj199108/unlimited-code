# Unlimit Code implementation checklist

Updated: 2026-09-24. Completed means verified; unfinished release prerequisites stay unchecked.

## Current product scope

An independent fork of OpenCode with the approved **Unlimit Code** name and infinity/caret logo, Paper/Ink themes, IBM Plex Mono, isolated application identity, fork-built desktop/CLI distribution, and reviewed upstream maintenance. Users connect their own providers, custom endpoints or local models. Agents, workflows and tools remain supported.

Supabase supplies optional profile login, email and an editable display name. Login is separate from provider authentication. There is no managed inference service, company-funded model catalog, subscription, checkout, or paid-access gate. The previous commercial plan is superseded; its historical record is in `branding/history/2026-09-23-managed-plan.md`.

## Scope change

- [x] Remove desktop workspace and prompt subscription gates.
- [x] Restore provider connections, custom providers, model selection and TUI `/connect`.
- [x] Remove CLI account/paid-access requirements for coding and provider commands.
- [x] Remove the company model gateway, local managed bridge and special OpenRouter vault.
- [x] Retain secure Supabase profile sessions and separate Account settings in both desktop layouts.
- [x] Add email/display-name profile details and browser profile editing with account ownership checks.
- [x] Retire checkout, billing portal, webhook and inference endpoints with HTTP 410; remove billing SDK and managed catalog code.
- [x] Replace subscription marketing, installation instructions and launch configuration with user-provider guidance.
- [x] Add a non-destructive database migration to retire client commercial access while retaining historical records.
- [x] Verify profile migration and OAuth/profile behavior against development Supabase; temporary accounts and credentials removed.
- [x] Complete regression checks and desktop/CLI/website builds for this scope change. Evidence: 109 engine/provider/server tests, 11 app tests, 12 branding/integration tests, 7 desktop session/storage tests, 6 CLI tests, release-config checks and 22 website tests; isolated database/RLS and hosted OAuth/profile checks pass. Browser profile editing and a compiled CLI task with a local provider pass.
- [ ] Update the existing review branches after resolving the concurrent software-pricing decision. Local commits contain verified changes; publication is paused because the landing-page task is adding a $99/month software plan. Its in-progress edits are preserved.

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
- [ ] Run an installed-app coding task using a user-selected provider or local model, and verify real email/browser sign-in.
- [ ] Finalize privacy/operator policies, account support and operational monitoring; promote a verified beta to stable.

Domain remains intentionally undecided. Billing prices, Dodo credentials, company OpenRouter keys and paid-access acceptance are no longer launch requirements. No running development app/server is restarted by this change.

## Coordination note (2026-09-24)

“Build Unlimit Code landing page” is concurrently editing the private website checkout and has a confirmed $99/month software-only plan. This task interpreted removal of managed subscriptions as removal of all paid-access gates. Clarify the software-subscription requirement before publishing or merging these differing policies. Managed company-funded inference is removed in either case. Existing release prerequisites above remain unchanged.
