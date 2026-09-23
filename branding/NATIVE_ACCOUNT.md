# Desktop profile login

Both desktop settings layouts provide separate **Account** and **Providers** sections. The account panel offers browser sign-in, verified email/display name, profile editing in the browser and logout. Provider setup, custom models and coding do not depend on account status.

The main process owns PKCE sessions, token refresh, callback validation and encrypted OS storage. The renderer receives profile state through first-party account IPC; it never receives access or refresh tokens. IPC handlers accept only the window's main frame. An unavailable secure-storage backend never falls back to plaintext. Logout fences concurrent refreshes.

Development uses `native-development.json` and `unlimitcode-dev://auth/callback`. Production and beta require their own public client configuration and exact owned callback schemes. The application has independent IDs, user-data paths and notification/native icons. Existing upstream application data is not automatically migrated.

There is no managed inference bridge or company provider key. Provider authentication follows the upstream engine independently. See [account/provider behavior](ACCOUNTS.md).

Verify from `packages/desktop` with `bun test src/managed`, `bun typecheck` and `bun run build`. The `src/managed` directory retains the shared profile-session/storage re-exports and regression tests; it does not implement managed model access.

Verified: seven profile/session/storage tests, hosted development PKCE/consent/account API/refresh/logout, and full development build. Existing macOS safeStorage acceptance remains recorded in the earlier implementation history. Installed callback/email acceptance, Windows desktop storage, signing/notarization and owned updater feeds remain in the [checklist](../IMPLEMENTATION_CHECKLIST.md).
