<p align="center"><img src="brand-kit/assets/unlimit-code-icon-original.png" alt="Unlimit Code logo" width="128" /></p>

# Unlimit Code

An independent [OpenCode](https://github.com/anomalyco/opencode) fork with the approved infinity/caret mark, Paper and Ink themes, IBM Plex Mono, and its own application identity. Connect your own providers or local models and keep your agents, tools, and workflows.

**No subscription is required.** Optional Supabase sign-in provides a profile with your email and display name. It does not gate coding, provision provider keys, or synchronize credentials.

Signed public installers and owned update feeds are still in preparation. The launch domain is undecided. Upstream OpenCode installers install the upstream product, not this fork.

## Desktop and terminal

In the desktop app, **Settings → Providers** manages your connections and **Settings → Account** manages your optional profile. In the terminal, use `/connect` and `/models` for model access.

```sh
unlimitcode ./my-project
unlimitcode auth login
unlimitcode run "Explain the failing test"

# Optional profile commands
unlimitcode login
unlimitcode account
unlimitcode account open
unlimitcode logout
```

Model providers set their own prices and limits. Standard provider credentials are stored through the underlying engine on your computer. Profile tokens use separate operating-system credential protection.

## Development

Use the workspace's Bun version and install dependencies from the root. Build the development desktop from `packages/desktop` with `bun run build`. Build the development CLI from `packages/unlimit-cli` with `bun run build --with-engine`; its launcher is `dist/unlimitcode.mjs` and requires Node.js 22.13 or newer. Build these sequentially because they share the engine output directory.

Run tests and `bun typecheck` from package directories. Do not run tests from the repository root.

## Maintaining the fork

The baseline is pinned in [branding/brand.json](branding/brand.json). Deterministic branding and reviewed overlays protect the changes during upstream integration. Proposed updates run regression checks before review; release publication is separate.

```sh
node branding/brand.mjs scan
node branding/brand.mjs apply
node branding/brand.mjs check
```

Technical compatibility identifiers, licenses, attribution, and third-party service names are preserved deliberately. Upstream package replacement and hosted sharing are disabled; updates must come from this fork's verified distribution.

- [Implementation checklist](IMPLEMENTATION_CHECKLIST.md)
- [Account and provider behavior](branding/ACCOUNTS.md)
- [Upstream maintenance](branding/UPSTREAM_MAINTENANCE.md)
- [CLI release packaging](packages/unlimit-cli/RELEASES.md)
- [Upstream attribution](UPSTREAM.md) and [license](LICENSE)

Inherited translated READMEs and upstream documentation may describe upstream distribution. This README and the checklist describe the current fork. Unlimit Code is not affiliated with or endorsed by Anomaly.
