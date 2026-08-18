# 15 — Landing page animation

**Request:** "Lets add animation to the public web."

Pushed to `main` as commit `60f032e`.

## What changed

- **`Reveal`** component — fades/slides in each below-the-fold section as it scrolls into view. Applied to Features, Tractor Mode, Integrations (header, hub-and-spoke diagram, card grid), Compliance, Australian Owned, and the CTA.
- **`animate-drift`** — a slow, continuous ambient motion added to the decorative `ContourLines` backgrounds behind the hero and CTA sections.
- A scroll-shadow on the sticky nav header, driven by a `window.scrollY` listener.
- A global `prefers-reduced-motion` CSS guard in `src/index.css`, collapsing all animation/transition durations to near-zero for users who've asked for reduced motion at the OS level.

## Design principle

Built defensively around a bug found earlier in a separately published setup guide: an IntersectionObserver-driven fade-in left content permanently invisible if the observer never fired in time. `Reveal` avoids this by defaulting to visible, only switching to hidden once an `IntersectionObserver` is confirmed available, and unobserving after the first reveal.

## Bug found and fixed during verification

An instant scroll jump (the **End** key, scroll restoration, etc.) can carry an element from below the viewport straight to above it without rendering an intermediate frame, so the `IntersectionObserver` never sees it intersect and the section would stay hidden forever. Fixed by adding a bounded 1.8s fallback timer to `Reveal` that force-reveals the section regardless of whether the observer ever fired.

## Verification

`tsc -b`, `oxlint`, and `vite build` all clean. Headless-browser screenshots (light mode, real `dark` class mode, 390px mobile) confirmed: natural scroll-through reveals every section, direct anchor-link navigation doesn't land on a stuck-invisible section, no horizontal overflow, and `prefers-reduced-motion` resolves to fully visible immediately.

## Key files

- `src/pages/LandingPage.tsx`
- `tailwind.config.js` (`drift` keyframe/animation)
- `src/index.css` (reduced-motion guard)
