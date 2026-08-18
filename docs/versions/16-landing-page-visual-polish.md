# 16 — Landing page visual polish

**Request:** "Lets make the public web, more pretty."

Pushed to `main` as commit `fe6f761`. A depth/craft pass layered on top of the existing design system from [12](12-landing-design-pass-1.md)–[15](15-landing-page-animation.md), rather than a restructure.

## What changed

- **Hero** — the "one map." highlight became a gradient-text treatment (farm green → emerald → earth gold); the primary CTA button gained a coloured glow shadow and lift on hover; a soft blurred glow now sits behind the browser-chrome mockup card for depth.
- **Tractor Mode** — gained the same `ContourLines` ambient-drift texture used in the hero and CTA, tying the dark sections together visually instead of leaving it flat.
- **Integrations** — the central FarmMap node in the hub-and-spoke diagram gained a soft glow ring so it reads as the "source" of the connections; all icon tiles (hub spokes and integration cards) gained ring/shadow polish for a more crafted, raised look.
- **Features & Compliance** — both sections gained soft, low-opacity blurred background blobs (contained within the section, `overflow-hidden`) for ambient depth behind the content.
- **Compliance mockup** — each Chemical Use Register row gained a colour-coded left border (amber = withholding period active, green = clear), matching how real compliance software signals status at a glance.

## Verification

`tsc -b`, `oxlint`, `vite build` clean. Headless-browser screenshots at desktop (light + dark) and 390px mobile confirmed no horizontal overflow and no regressions from the added decorative elements.

## Key files

- `src/pages/LandingPage.tsx`
