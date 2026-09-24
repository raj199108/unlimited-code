# Unlimit Code — Landing Page Design Brief

## Direction

Build a polished, responsive landing page for **Unlimit Code**, a coding agent with a terminal-native identity. Use the supplied original infinity/caret icon, IBM Plex Mono, and the exact Paper/Ink colour pair. The page should feel focused and confident, with large type and carefully aligned space.

Start with the **Paper** theme. Use **Ink** for the terminal demonstration. Include a full Ink alternate only when the product needs a theme control. The brand should remain recognisable in either mode.

## Non-negotiable visual rules

- Background `#fdfcfc`; ink `#201d1d`. Only invert these two colours.
- IBM Plex Mono: 400 for body, 500 for headings, 600 for concise emphasis.
- Original first icon preserved; cream holding square on dark surfaces.
- Exact product name: **Unlimit Code**.
- Square corners, thin rules, no shadows, gradients, glow, glass, bevels, textures, or decorative colour.
- Space and type establish hierarchy. Avoid grids of generic feature cards.
- Main width 1200px; 20px minimum mobile gutters; 56–96px between sections.
- Zero border radius; 48px controls; visible keyboard focus.
- Brief feedback transitions only; honour reduced motion.

## Page sequence

1. **Header:** Original icon and product name. Up to three real navigation destinations and one primary CTA. Keep the logo on the left and actions on the right.
2. **Hero:** Eyebrow identifying the product category, a two-line heading, a concise product description, one primary action and one secondary link. Suggested heading: “From intent to code.”
3. **Product demonstration:** One large, crisp terminal view using a real product capture or truthful interactive demonstration. Use the Ink theme. Do not fabricate a working product session.
4. **Workflow:** Three broad horizontal rows, each with a small index, a short action heading, and one explanation. Suggested narrative: Describe → Build → Refine. Adjust to the actual workflow.
5. **Capabilities:** Two or three concrete, verified product capabilities. Show evidence or a relevant interface detail where available. Do not add capabilities simply to fill the layout.
6. **Getting started:** Actual install command or real download/account CTA. If a copy button is shown, it must copy the exact supported command. Include relevant platform requirements.
7. **FAQ:** Answer real questions about setup, supported environments, models, cost, data handling, and review controls, using supplied facts. Omit unsupported claims.
8. **Closing action and footer:** Repeat the main action, then real docs, repository, support, and policy links as applicable.

Do not invent a pricing section, signup flow, social proof, customer logos, statistics, or a product download command. Leave unavailable sections out until the facts exist.

## Content to supply for production

| Input | Used for |
| --- | --- |
| Primary conversion and destination | Hero, header, closing CTA |
| Installation command / download URL | Getting started |
| Supported systems and model providers | Features and FAQ |
| Two or three verified differentiators | Hero support and capabilities |
| Real terminal captures or runnable demo | Main product demonstration |
| Pricing, usage limits, and account requirements | Pricing link and FAQ, if relevant |
| Data-handling facts and policies | Trust copy and footer |
| Docs, repository, support, and social URLs | Navigation and footer |

## Ready-to-paste implementation prompt

> Build the Unlimit Code landing page using the provided brand-kit/theme.css, bundled fonts, original icon, tokens.json, and this design brief. Use the Paper theme with an Ink terminal section. Keep the two-colour palette, monospace typography, zero corner radius, and open row-based layout. Adapt index.html as the visual reference, removing all brand-kit controls. Write semantic responsive HTML/components, support keyboard navigation and reduced motion, and use only the verified product facts and real URLs I provide. Label any demonstration that remains conceptual. Make the actual primary action work. Validate the page at small mobile and desktop widths and in both supported themes.
