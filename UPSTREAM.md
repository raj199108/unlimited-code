# Upstream attribution and fork policy

Unlimit Code is an independently operated fork of [OpenCode](https://github.com/anomalyco/opencode), originally developed by Anomaly and its contributors. It is not an Anomaly product or an endorsement by Anomaly. The original MIT license and copyright notices are retained unchanged in LICENSE and package licenses.

The initial stable baseline is v1.18.32 at `545f51d26cc39a907d2867492d498d9607ea5fa4`. Our product release version is independent of that baseline. Product work lives on `main`; integration branches use `codex/`. Review upstream stable releases before promotion.

Internal package namespaces, schema URLs and project-file formats remain compatible. Their spelling does not imply that hosted upstream services are included. Paid services, public downloads and auto-updates must remain disabled until our independently operated endpoints and release checks are complete.

The original approved icon and fonts are in `brand-kit/`. IBM Plex Mono is distributed under the included SIL Open Font License (`brand-kit/fonts/LICENSE.txt`). Keep that license with copied fonts.

See IMPLEMENTATION_CHECKLIST.md for the implementation status. Branding coverage is deliberately measured: reviewed display-string targets, checksummed source overlays, and a wider inventory of unresolved names, technical identifiers, URLs and assets. A passing branding check does not mean the entire product is ready to release.
