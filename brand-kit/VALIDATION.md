# Preview validation

Checked on 22 September 2026 in the Codex in-app browser.

- Visually inspected the desktop landing layout and the brand-system layout.
- Inspected Paper and Ink themes, including mobile controls and typography.
- Checked both views at 375px and 320px viewport widths; final checks found no horizontal page overflow.
- Corrected narrow-screen minimum-width behaviour in the identity and component examples.
- Verified the primary and secondary action example, empty-field validation, successful validation, and linked error state.
- Verified keyboard focus: the secondary button receives a visible 2px outline with 4px offset.
- Confirmed the browser reports fonts loaded and no page warning/error logs in the final check.
- Checked JavaScript syntax with `node --check`.
- Parsed `tokens.json` and checked every relative HTML asset/link resolves to a local file.
- Verified the CSS declares only `#fdfcfc` and `#201d1d` as colour literals.
- Calculated Paper/Ink contrast from sRGB relative luminance: **16.34:1**.
- Restored the browser's normal viewport after mobile checks.

This is a targeted visual and interaction check, not a complete accessibility audit. The original logo is preserved raster artwork; the exact palette check applies to the theme CSS.
