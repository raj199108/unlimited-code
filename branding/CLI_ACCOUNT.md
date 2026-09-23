# CLI profile login

The `unlimitcode` launcher adds optional profile commands to the fork-built engine. `login` opens the browser; `account` shows verified email/display name; `account open` edits the profile on the website; `logout` revokes the local session. No profile or subscription check precedes coding or provider commands.

The development public OAuth client is configured in `cli-development.json`, with exact loopback callback `http://127.0.0.1:32187/auth/callback`. PKCE and state bind a pending browser login to that CLI invocation. The callback rejects hostile origins, duplicate/replayed callbacks and occupied ports. Production builds require explicitly validated public HTTPS account configuration.

Profile credentials live under `~/.unlimitcode/cli-<channel>` with channel-specific operating-system storage identity. macOS uses Keychain-backed encryption, Windows uses DPAPI, and Linux uses Secret Service. Cross-process locks serialize refresh and logout; generation fencing prevents a late login from restoring a signed-out session. Provider credentials use the underlying engine's separate local authentication/configuration.

Run package typecheck and `bun run test` from `packages/unlimit-cli`. Build with `bun run build --with-engine`, then run `node script/smoke.mjs` to verify a real CLI task against a synthetic local model without profile login. Keep desktop and CLI builds sequential because they share engine build output.

Verified: six CLI tests including real macOS Keychain, independent-process refresh, state/PKCE callbacks and logout; hosted development OAuth/profile/refresh/revocation with temporary accounts; compiled local-provider task. Earlier cross-platform account/storage CI passed on macOS, Windows and Linux; the changed release still needs installed macOS/Windows acceptance.

See [release packaging](../packages/unlimit-cli/RELEASES.md), [account behavior](ACCOUNTS.md) and the [checklist](../IMPLEMENTATION_CHECKLIST.md). Signing, bundled runtimes, public installers and owned update feeds remain release prerequisites.
