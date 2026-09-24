# Unlimit Code — Brand & Theme Kit

Version 1.0 · 22 September 2026

The direction is **terminal precision with room to build**: warm paper, near-black ink, monospace typography, sharp controls, and generous space. The first angular infinity icon with the command caret anchors the identity.

## Start here

Open `index.html` in a browser. Switch between **Landing preview** and **Brand system**, then compare **Paper** and **Ink**. The preview works without a build step or external font requests. Clipboard access may be unavailable when opened directly from disk; the values remain selectable.

For a local HTTP preview, run this from the kit directory:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173`. The top toolbar belongs to the kit; remove it when adapting the landing theme into the product website.

| File | Purpose |
| --- | --- |
| `theme.css` | Reusable colour, typography, spacing, component, and motion styles |
| `tokens.json` | Framework-independent design token values |
| `index.html` | Responsive landing theme and interactive brand guide |
| `preview.css`, `preview.js` | Preview-specific layout and local interactions |
| `landing-page-brief.md` | Ready-to-use design and content brief for the actual website |
| `assets/unlimit-code-icon-original.png` | The selected first icon, preserved unchanged |
| `assets/unlimit-code-wordmark.png` | Existing generated wordmark artwork |
| `fonts/` | IBM Plex Mono webfonts at 400, 500, 600, with license |

## 1. Brand foundation

- **Name:** Unlimit Code. Preserve capital U and capital C, with one space.
- **Category:** Coding agent product with a terminal/TUI identity.
- **Personality:** Focused, capable, direct, open-ended.
- **Brand idea:** A clear space between intent and code.
- **Suggested headline:** From intent to code.
- **Suggested short line:** Code, unbound.
- **Visual principle:** Space is the accent. Hierarchy comes from typography, alignment, weight, and inversion.

These are proposed positioning and copy directions. “Unbound” is brand language, not a claim of unlimited usage, unlimited context, or unrestricted access.

## 2. Logo and identity

Use `assets/unlimit-code-icon-original.png`: the first angular infinity path with the command caret in its left side. Its diagonal segments are part of the selected artwork. The surrounding interface keeps square 90-degree corners.

The original is a transparent raster PNG, 1254 × 1254. Preserve its aspect ratio and built-in padding. Display it on cream, including inside a cream holding square when the page is dark. Do not stretch it or put dark ink directly on a dark surface. The preview uses the supplied file unchanged.

Minimum application-icon canvas: 32px; prefer 48–64px in a website header. At 32px the symbol is deliberately small because the original image includes substantial padding. Inspect that exact size before choosing it as a production favicon. For large editorial placement, use a 240–420px canvas.

For clear space, leave at least one visible stroke thickness around the symbol; the supplied PNG already includes more. In a live text lockup, leave 8–12px between its canvas and the product name. Keep the baseline visually centred beside the icon.

The included generated wordmark is artwork, not an installable custom font. The preview uses a text lockup in IBM Plex Mono 600 for crisp responsive rendering. Use the supplied wordmark image when its specific custom lettering is required. Do not try to reproduce every letter by changing a website font's tracking.

The supplied logo assets are PNGs. A precisely drawn SVG master remains a separate production asset for exact-path editing and print; this kit does not mislabel raster artwork as vector. Generated pixels may have edge antialiasing and slight colour variation; the website tokens use the exact specified values.

No alternate initials, mascots, competitor marks, decorative glow, soft containers, or added company names.

## 3. Colour system

Only two authored colours:

| Colour | Hex | RGB | Role |
| --- | --- | --- | --- |
| Paper | `#fdfcfc` | 253, 252, 252 | Light background, negative space, dark-theme text |
| Ink | `#201d1d` | 32, 29, 29 | Light-theme text, rules, primary actions, terminal surface |

| Semantic role | Paper theme | Ink theme |
| --- | --- | --- |
| Background | Paper | Ink |
| Foreground | Ink | Paper |
| Rules and input borders | Ink | Paper |
| Primary action fill | Ink | Paper |
| Primary action label | Paper | Ink |
| Secondary action | Unfilled with foreground border | Unfilled with foreground border |
| Focus outline | Ink | Paper |
| Logo holding surface | Paper | Paper |

**Recommended landing theme: Paper**, with a large Ink terminal panel. Use the fully inverted **Ink** version as the alternate theme. In Ink, frame an Ink terminal panel with a Paper rule if its outline must be visible.

Keep secondary text full-contrast. Use smaller type, regular weight, whitespace, or a label to reduce emphasis. Do not invent grey colour tokens or use opacity to mute text. Browser antialiasing is expected; the source palette remains two colours.

Encode meaning with words and markers: `[OK] Ready`, `[··] In progress`, `[!] Needs attention`, `[×] Could not complete`. In a diff, show literal `+` and `−` prefixes plus clear labels. Avoid red/green syntax colouring in the core theme.

## 4. Typography

**Website typeface: IBM Plex Mono.** Use one family throughout the landing page, controls, labels, code examples, and documentation navigation.

The official IBM package is open source under the SIL Open Font License 1.1. This kit includes the unchanged complete WOFF2 files from `@ibm/plex-mono` version `2.5.0`, plus its license. Keep the license with redistributed fonts. Source: [IBM Plex repository](https://github.com/IBM/plex/blob/master/README.md) and [IBM typeface documentation](https://www.ibm.com/design/language/typography/typeface/).

| Role | Desktop | Mobile | Weight | Line height | Tracking |
| --- | --- | --- | --- | --- | --- |
| Hero display | Up to 80px | 36–64px fluid | 500 | 1.08 | −0.045em |
| Section heading | Up to 48px | 28px minimum | 500 | 1.2 | −0.035em |
| Subheading | 24px | 22–24px | 500 | 1.3 | −0.03em |
| Lead | 18px | 16px | 400 | 1.65 | Normal |
| Body | 16px | 16px | 400 | 1.65 | Normal |
| Controls and code | 14px | 14px | 400–500 | 1.5–1.7 | Normal |
| Eyebrow / metadata | 12px | 12px | 500 | 1.5 | +0.08em |
| Live text wordmark | 18px | 16px | 600 | Inherit | +0.025em |

Set paragraphs to a maximum of about 60 characters per line; shorten hero descriptions to about 40–48. Reserve uppercase and wide tracking for short labels. Avoid all-caps paragraphs and thin weights. Use sentence case for buttons.

Fallback stack:

```css
font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Consolas, monospace;
```

Use `font-display: swap`, normal letter spacing in code, and `font-variant-ligatures: none` for unambiguous punctuation. Do not distort or stretch font glyphs to imitate the generated wordmark.

## 5. Layout and spacing

Use a 4px base with the practical scale **4, 8, 12, 16, 24, 32, 48, 64, 96px**.

- Main content maximum: 1200px, centred.
- Page gutter: 20px on small screens, increasing to 56px.
- Main section spacing: 56px mobile, up to 96px desktop.
- Hero: two columns on desktop, one column at 720px and below.
- Desktop working grid: 12 columns; use 7/5 or 8/4 splits where content warrants it.
- Component padding: 16–24px compact, 32–40px for large panels.
- Rules: 1px solid foreground. Corners: 0px. Shadows: none.
- Keep one primary CTA per section. Use a secondary outline or text link for the next action.
- Prefer full-width rows and open sections. Reserve panels for actual bounded content, such as a terminal or form.

Breakpoints in the preview are 1000px for tighter desktop/tablet spacing, 720px for stacking, and 400px for the smallest controls. Responsive decisions should follow content width, not device names.

## 6. Components and states

**Buttons:** 48px high, 20px horizontal padding, 1px border, zero radius. Primary uses foreground fill with background-colour text. Secondary is outlined. Hover inverts the pair and/or underlines the label. Pressed state strengthens the underline. Disabled controls use a dashed outline and clear unavailable wording; do not rely on reduced opacity.

**Inputs:** Visible label, 48px minimum height, 16px horizontal padding, solid outline. An invalid field uses a 2px dashed border and an explicit error message linked with `aria-describedby`. Placeholder text is not a replacement for a label.

**Focus:** 2px foreground outline, 4px offset. On fixed dark terminal surfaces, focus is Paper. Preserve native keyboard behaviour and a visible focus indicator in both themes.

**Terminal panels:** Ink background and Paper text. Use a square top bar with a workspace label and text status. No red/yellow/green window dots, fake OS chrome, glow, or scanline noise. Label conceptual sessions as illustrative until real product captures are available.

**Navigation:** 48–64px icon canvas, live product name, 2–4 relevant links, one main action at most. On small screens, keep the name readable and collapse secondary navigation intentionally.

**Iconography:** Use simple command punctuation and crisp line icons with square ends. Prefer textual action labels. Do not use emoji or colourful icon sets as part of the product theme.

**Motion:** A 120ms colour transition for hover/focus feedback; no entrance animation, parallax, continuous cursor blinking, or decorative motion. Respect `prefers-reduced-motion`.

## 7. Voice and copy

Use direct verbs, concrete outcomes, and calm status messages. Speak to developers without making every sentence sound like a shell command.

| Context | Suggested wording |
| --- | --- |
| Hero | From intent to code. |
| Short brand line | Code, unbound. |
| Intro | Unlimit Code brings the coding agent into your terminal. |
| Action | Review changes |
| Secondary action | Read the docs |
| Success | Changes are ready to review. |
| Empty state | Choose a project to get started. |
| Error | Couldn't open this file. Check the path and try again. |

Avoid unverified claims about speed, privacy, security, model support, pricing, autonomous capabilities, or unlimited usage. No invented customers, testimonials, logos, benchmarks, download counts, or installation commands.

## 8. Using the CSS

Keep `theme.css` next to the bundled `fonts` directory, or update its font paths when relocating it.

```html
<html lang="en" data-uc-theme="paper">
  <head>
    <link rel="stylesheet" href="/brand/theme.css">
  </head>
  <body class="uc-theme">
    <main class="uc-container">
      <p class="uc-label">Coding agent / Terminal-native</p>
      <h1 class="uc-display">From intent to code.</h1>
      <p class="uc-body">Your approved product description.</p>
      <a class="uc-button" href="/docs">Read the docs</a>
    </main>
  </body>
</html>
```

To invert a page or local section, set `data-uc-theme="ink"`. Use semantic variables (`--uc-bg`, `--uc-fg`, `--uc-action-bg`) inside components. Reserve literal palette variables for explicitly fixed surfaces such as the original logo's cream square.

`tokens.json` is a plain, framework-independent JSON reference, not a claimed Figma or DTCG import format. `theme.css` is the directly usable implementation.

## 9. Landing page content handoff

The preview demonstrates the visual theme and proposed copy. Its local links and sample form work, but it is not connected to a product, account, waitlist, or API. The terminal session is explicitly illustrative. No site has been published.

Before making the product page live, supply the actual primary CTA destination, installation method, supported environments, product captures, verified features, and any pricing or policy links. Use `landing-page-brief.md` to continue with those facts. The brand and theme decisions are already usable without them.
