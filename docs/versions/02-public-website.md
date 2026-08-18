# 02 — Public marketing website

**Request:** "Can you review everything for FarmMap and create me a Public Website for it."

## What changed

- Added `LandingPage.tsx`, a marketing page shown at `/` to unauthenticated visitors (`AuthPage` moved to `/login`), routed via `App.tsx` inside `BrowserRouter`.
- Sections: hero, farm-type coverage, feature grid, Tractor Mode highlight, integrations, compliance, CTA, footer.
- Copy and feature list generated from a review of the actual app (paddocks, livestock, crops, equipment, finance, compliance, reports) so the site reflects real functionality rather than generic SaaS marketing.

## Key files

- `src/pages/LandingPage.tsx`
- `src/App.tsx` — routing for logged-out vs logged-in state
