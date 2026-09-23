# Reviewed upstream integration

The six-hour/manual workflow prepares a draft integration only. It does not merge, deploy or release. The maintained branch is `main`, and the upstream compatibility baseline is recorded independently of the product version in `branding/brand.json`.

## Preparation and publication boundaries

The `prepare` job has only `contents: read`. Checkout does not persist credentials. A read-only token is available for official release discovery; dependency/test/build subprocesses receive an allowlisted environment without GitHub, artifact, provider or other publishing credentials. The publishing secret is not available anywhere in this job.

`sync-upstream.mjs` rejects draft/prerelease/downgrade tags, requires a descendant of the pinned upstream commit, and creates `codex/upstream-vX.Y.Z`. It merges without committing and stops on merge conflicts, any changes under `.github`, unknown display branding or changed overlays. Branding checks run before installing the updated dependency graph. After installation it checks branding again, runs branding tests, app/desktop/TUI/UI/engine typechecks, managed-account/bridge/provider/theme/catalog/deep-link tests and app/desktop builds. Success produces a Git bundle and a report. Failures retain a report and do not push anything.

The fresh `publish-draft` job checks out trusted `main`, downloads the bundle and runs `publish-upstream.mjs` from that trusted checkout. It never checks out the candidate, installs dependencies or executes candidate code. It independently verifies bundle HEAD, the official upstream tag SHA, both parent ancestries, unchanged automation and matching baseline metadata. It pushes only the validated `codex/upstream-vX.Y.Z` branch with Git hooks disabled and then creates a draft PR. This job alone receives the narrowly scoped publishing secret.

The boundary protects publishing credentials; it does not certify upstream code as safe. Human review and installed/native/provider acceptance remain required even if an upstream build changes its own tests. No candidate can automatically promote itself to `main` or a signed release through this workflow.

## Activation and operations

The workflow and scripts must first be reviewed and merged onto the default `main` branch. Configure `UPSTREAM_SYNC_TOKEN` for this fork only, with contents and pull-request write access. A static fine-grained PAT must be rotated before expiry. If using a GitHub App instead, add fresh installation-token issuance in the publishing job; an hour-lived installation token stored once as a repository secret is not suitable for a recurring schedule. Credentials are not requested or committed by this implementation.

Preparation runs every six hours at minute 17, or manually. When already current, or when an integration branch exists, it records that state without creating another branch. Review the existing branch/PR. If a push succeeded but PR creation failed, repair the credential and create the draft PR for that existing branch; do not delete or overwrite it as a retry. A changed `main` between preparation and publication stops publication and requires a fresh preparation.

For a failed merge, inspect the `upstream-report` artifact and read-only job logs. Reconcile changed overlays against the new upstream source and update their checksums only after reviewing the behavior. Review any new upstream automation outside the active workflow directory. Never make an overlay accept every checksum, globally replace compatibility identifiers, restore upstream release feeds, or bypass branding checks to get a green run.

The schedule is not activated yet: the implementation is on the review branch and the scoped publishing credential has not been configured. GitHub's latest official stable release was checked on 2026-09-23 and was still the pinned v1.18.32, so no real newer release was merged in this run.

## Rehearsal evidence

`bun test` from `branding` runs 11 tests. Five integration cases use disposable real Git repositories and the same merge/drift functions as the workflow:

- A clean upstream engine change merges while the branded logo remains intact; reapplying branding is a no-op and the candidate can be bundled.
- A conflicting upstream logo change remains an explicit Git conflict and leaves the maintained template intact.
- New upstream workflows and new unreviewed display names stop preparation.
- Drafts, prereleases, malformed tags and downgrades are rejected.
- Publishing, artifact and model credentials are stripped from the environment passed to dependency/build checks.

`actionlint` validates the two active workflows. These local rehearsals do not mark a live scheduled run, GitHub publishing credentials, installed upgrades or release acceptance complete.
