# 13 — Australian sovereign branding

**Request:** "Lets add a Aussie shabang to it, it's created as an Australian Sovereign Software."

## What changed

- New **"Australian Owned"** section on the landing page with an Eyebrow badge, copy about local ownership/hosting/support, and a checklist (hectares/AUD/GST/NLIS/PIC built in from day one, not bolted on).
- **`SovereignSeal`** component — a circular badge SVG with curved `textPath` text reading "AUSTRALIAN OWNED" / "SOVEREIGN SOFTWARE" around two concentric rings, plus a Southern Cross (Crux) constellation drawn as five dots on asymmetric, astronomically-correct coordinates rather than a generic symmetric diamond.
- **`ContourLines`** component — decorative topographic wavy-line SVG background, used behind the hero and CTA sections.

## Bugs found and fixed

- The seal's bottom curved text initially read backwards ("SOFTWARE SOVEREIGN") due to an incorrect SVG arc sweep-flag; fixed by matching the direction/sweep logic of the already-correct top arc.
- The Southern Cross was originally a plain symmetric diamond, not recognisable as the real elongated Crux shape; repositioned to the correct asymmetric layout.
- 🇦🇺 flag emoji rendered as literal "AU" text on Windows (Segoe UI Emoji has never shipped colour flag glyphs, a deliberate Microsoft design choice) — confirmed by zooming into a screenshot, then removed entirely in favour of the words, a `BadgeCheck` icon, and the `SovereignSeal` graphic.

## Key files

- `src/pages/LandingPage.tsx`
