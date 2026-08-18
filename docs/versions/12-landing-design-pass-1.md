# 12 — Landing page design pass 1

**Request:** "Lets up the design on the public website."

The first of two dedicated visual-design passes on the marketing site (as opposed to the app itself).

## What changed

- Added **Fraunces**, a display serif, for headline moments only (`font-display` in `tailwind.config.js`) — the app itself stays on Inter throughout.
- Reusable **`Eyebrow`** component (icon + small-caps label, with `dark`/`light`/`earth` tone variants).
- Browser-chrome-style hero mockup (a fake browser window frame around the paddock map preview).
- A `fade-up` keyframe/animation for hero content on page load — pure CSS, runs once on paint, never conditional on JS.
- Feature grid retoned with a `tone: 'farm' | 'earth' | 'sky'` system per feature, mapped to distinct tile gradients and icon colours.

## Key files

- `src/pages/LandingPage.tsx`
- `tailwind.config.js`
- `index.html` (Fraunces font link)
