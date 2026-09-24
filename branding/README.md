> Current scope: branding, themes, independent distribution and required account login and paid software access. Models use the user’s own provider connections. See [accounts](ACCOUNTS.md) and the [active checklist](../IMPLEMENTATION_CHECKLIST.md). Older managed-service references are superseded.

# Maintained branding layer

Current account/provider policy: [software subscriptions and user-configured providers](ACCOUNTS.md). An active software subscription is required. Company-funded model access is not part of the product.
The product name is **Unlimit Code**. `brand.json` is the source of truth. The repository/directory slug `unlimited-code` does not change the approved display name.

Run `bun run brand:scan`, `bun run brand:apply`, and `bun run brand:check` from the repository root. Run tooling tests from this directory with `bun test`.

`text-targets.json` records the reviewed counts of display-name occurrences in each shipping source/documentation file. TypeScript is parsed so replacements affect literal text and JSX text, never imported SDK identifiers. `overlays.json` pins the upstream checksum of each whole-file asset/component replacement. A missing file, unexpected occurrence count, new unreviewed display-name file, or changed overlay fails before any files are written. Review the upstream diff before updating these manifests.

Compatibility exceptions include third-party service names (OpenCode Zen/Go), plus `@opencode-ai/*` workspace/dependency imports, `OPENCODE_*` environment variables, existing project config filenames, schema URLs, API field names, and internal IDs remain unchanged in this initial layer. Upstream LICENSE and copyright notices are preserved. Text scanning is not proof that raster images or service URLs are rebranded; remaining asset, service, packaging, and visual work is tracked in `IMPLEMENTATION_CHECKLIST.md`.

Reports inventory all tracked case-insensitive `open[ _-]?code` matches. `brand:check` enforces the reviewed display-name and overlay scope; it does not claim all remaining matches are approved for production.

Production stays disabled until domain/API/download URLs, production profile authentication, signing, private update delivery, and the remaining release checklist are configured and verified. Never publish upstream's original release/deployment workflows from this fork.

Upstream preparation, credential isolation, review procedures and rehearsal evidence are documented in [UPSTREAM_MAINTENANCE.md](UPSTREAM_MAINTENANCE.md).
