# 14 — Landing page design pass 2

**Request:** "Lets up the design on the website" (asked a second time; clarified via a follow-up question that the target was the public marketing site, not the app).

A second uplift pass addressing visual gaps left after [12](12-landing-design-pass-1.md).

## What changed

- Farm-type list changed from plain comma-separated text to pill-shaped chips.
- Paddock shapes in the hero mockup changed from plain rectangles to irregular, hand-drawn-looking shapes via `clip-path: polygon(...)`.
- Fixed the floating "Rainfall" badge overlapping the paddock-count/sync status row in the hero mockup — the card had grown taller after the browser-chrome treatment in [12](12-landing-design-pass-1.md); resolved by increasing its offset.
- Fixed `text-wrap-balance`, an invalid Tailwind class name, to the real utility `text-balance` (6 occurrences).

## Key files

- `src/pages/LandingPage.tsx`
