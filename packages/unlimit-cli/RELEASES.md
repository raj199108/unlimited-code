# CLI release packaging

Development builds use the dedicated development account configuration. Beta/production builds require `branding/brand.json` release approval, `UNLIMIT_RELEASE_APPROVED=true`, and `UNLIMIT_ACCOUNT_CONFIG` pointing to a JSON file with exactly `site`, `issuer`, `clientId`, `redirectUri`, and `publishableKey`. These are public values. HTTPS origins and exact callbacks are validated; unknown fields and secret keys are rejected. Do not commit production credentials.

Build on each target OS/architecture from this package:

```
OPENCODE_CHANNEL=prod bun run script/build.ts --with-engine
```

The release account file uses the separately registered CLI public client and exact loopback callback `http://127.0.0.1:32187/auth/callback`. Profile login is optional and uses OS-protected session storage. Coding uses the user's provider credentials and configuration, with no managed gateway or subscription requirement.

Supply `UNLIMIT_NODE_BINARY`, `UNLIMIT_NODE_LICENSE`, and `UNLIMIT_NODE_SHA256` for an independently verified official Node distribution matching the build OS/architecture. Sign the fork engine and verify both executables with the relevant OS tools. Run:

```
bun run script/package.ts
```

This creates the versioned `tar.gz` or `zip` and prints its exact byte size, SHA-256 and SHA-512. The archive contains the launcher, fork engine, Node runtime, Node license, upstream license, and version metadata. macOS launcher execution resolves the installer's symlink to the bundled runtime.

Packaging is not publication or notarization. Complete macOS Developer ID/notarization and Windows Authenticode acceptance, verify the desired signing identity, and test on a fresh OS account. Add the archive to schema 2 of the private platform's publisher-signed release catalog. Schema 1 desktop identities remain unchanged. Publish only after `release:verify` succeeds.

The website installers verify checksums, install into a versioned user directory and expose `unlimitcode` on the user PATH. The Windows script needs an actual Windows installation test before launch; the current development machine is macOS. Releases are public to download. Provider connections and coding work without a profile session; model usage is billed by the chosen provider.

After building with the engine, run `node script/smoke.mjs` to verify that a task completes through a local user-configured provider without login or subscription. The fixture uses synthetic credentials and removes its temporary project.
