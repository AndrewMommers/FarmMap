# 17 — Portal completeness, notifications, and Farm Chat

**Requests:** "Can you check the logs of me clicking the no me sign out... it's on the Create your property screen" → "The issue is, when in the logged in as demo and I refresh, it goes to the Create your property screen"; "Lets review the notifications... create a details UI for when the user clicks on it"; "add farm chat"; "Lets update the public page (landing page) with the latest changes and features".

A large, multi-part stretch of work. Grouped here as one phase since it spans many small commits (see `git log`) rather than one clean feature. Every item below closed a tracked GitHub issue unless noted.

## Portal completeness (closes #1–10, #18, #19 in part)

Worked through the `docs/TODO.md` punch list top to bottom: removed a stale committed file, added a real forgot-password flow, added a global React error boundary, and wired up every stub "coming soon" button across Paddocks (spray records, activity log), Livestock (movement, treatment), Crops (record yield, create crop), Equipment (log service), Compliance (register export), and Settings (edit user, data export/import). Each was verified by actually clicking through the flow in a headless browser, not just typechecked.

## Notification system

- **Detail modal** — clicking a bell alert now opens a quick-glance modal (full record + badges + quick actions like Mark Done) with a link to the filtered list page, instead of just navigating away.
- **Live toast pop-ups** — a newly-appearing alert (an edit that pushes something into alert territory while the app is open) pops a toast immediately.
- **Browser push notifications** — real Web Notifications API support via the PWA service worker, gated behind honestly-labelled per-category preferences (three of the six categories are disclosed as "coming soon — not yet wired" rather than faked).
- **Farm-wide announcements + Farm Chat** — a shared, realtime, farm-wide feed (anyone posts, everyone sees; no DMs, no threading by design), available both as a quick-glance tab in the bell dropdown and as a dedicated "Farm Chat" page with real chat UX (bubbles, own/others alignment, day dividers, auto-scroll).

## Bug fix: demo mode losing data on refresh

Root cause of "refreshing while in demo mode dumps me on the Create Your Property screen": `appStore`'s `demoMode` flag is persisted, but `dataStore`'s actual mock records deliberately aren't — a refresh left `demoMode: true` with `farms: []`, which the routing logic read as "signed in, zero farms" and sent to onboarding. Fixed by auto-restoring demo data on mount whenever that inconsistent state is detected, and fixed the onboarding screen's sign-out button to properly exit demo mode instead of attempting a no-op real auth sign-out.

## Landing page update

Added a "Farm Chat" feature tile, fixed the Weather tile's "rainfall vs. long-term average" claim (never actually implemented — see [#20](https://github.com/AndrewMommers/FarmMap/issues/20)) to match reality, and added a live-alerts/push-notification bullet plus a second toast in the Tractor Mode mockup.

## New gaps found along the way

Three more real gaps surfaced during this stretch and got tracked rather than silently skipped: no "Invite User" flow ([#19](https://github.com/AndrewMommers/FarmMap/issues/19)), no real document storage/PDF viewer for Compliance documents ([#21](https://github.com/AndrewMommers/FarmMap/issues/21)), and a PWA manifest referencing icon files that don't exist ([#22](https://github.com/AndrewMommers/FarmMap/issues/22)).

## Key files

- `src/pages/PaddocksPage.tsx`, `LivestockPage.tsx`, `CropsPage.tsx`, `EquipmentPage.tsx`, `CompliancePage.tsx`, `SettingsPage.tsx`, `ChatPage.tsx` (new)
- `src/components/modals/` — several new modals (spray record, paddock log, mob movement/treatment, record yield, log service, add crop, edit user, notification detail)
- `src/components/layout/Header.tsx`, `Sidebar.tsx`
- `src/store/dataStore.ts`, `appStore.ts`, `src/hooks/useNotifications.ts`
- `src/lib/pushNotifications.ts` (new)
- `supabase/schema.sql` — `announcements` table
- `src/App.tsx`, `src/pages/onboarding/CreateFarmPage.tsx` — demo-mode refresh fix
- `src/pages/LandingPage.tsx`
