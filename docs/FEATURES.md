# FarmMap — Feature Status

A complete inventory of what's built and working versus what isn't, across the public website and the authenticated portal. Compiled by auditing the actual code (not just the marketing copy) as of 2026-08-18.

**Legend:** ✅ complete & verified · 🚧 partial (some actions work, some don't) · ⚠️ built but unverified against a real external system · ❌ not started

## Public website

| Feature | Status |
|---|---|
| Landing page (hero, features, integrations, compliance, CTA) | ✅ |
| Tractor Mode showcase section | ✅ |
| Australian ownership / sovereign-software branding | ✅ |
| Scroll-reveal animation, ambient motion | ✅ |
| Responsive (mobile/tablet/desktop) | ✅ |
| Dark mode | ✅ |

See [`docs/versions/`](versions/README.md) for how each of these was built.

## Core farm records

| Feature | Status | Notes |
|---|---|---|
| Paddock mapping (draw boundaries, fence lines, map features) | ✅ | |
| Paddock spray records | ✅ | Feeds directly into the Compliance chemical register |
| Paddock activity log (crop + spray history) | ✅ | |
| Livestock — mobs & individual animals (add/edit/delete) | ✅ | |
| Livestock — record movement | ✅ | Updates mob's paddock, logs a dated entry |
| Livestock — add treatment | ✅ | Logs a dated entry (drench, vaccination, etc.) |
| Crops — create record | ✅ | |
| Crops — record yield | ✅ | Marks the record harvested |
| Equipment — fleet management (add/edit/delete) | ✅ | |
| Equipment — log service | ✅ | Updates last/next service date, clears maintenance status |
| Finance — transactions & budgets | ✅ | |
| Inventory | ✅ | |
| Tasks | ✅ | |
| Weather — current conditions & rainfall history | 🚧 | Rainfall vs. long-term average is **not implemented** — `avgRainfallMm` is hardcoded to 0 and never rendered (free Open-Meteo tier has no climate normals). Landing page copy overclaims here. ([#20](https://github.com/AndrewMommers/FarmMap/issues/20)) |
| Reports — PDF/CSV export (all record types) | ✅ | |

## Compliance

| Feature | Status | Notes |
|---|---|---|
| Chemical use register (built from spray records) | ✅ | |
| Withholding-period (WHP) tracker & alerts | ✅ | |
| Register PDF export | ✅ | |
| Regulatory document list (MSDS, PIC, licences) | ❌ | Hardcoded mock list, not real per-farm documents — no storage/upload exists yet, and the "View" button is a stub that doesn't open anything ([#21](https://github.com/AndrewMommers/FarmMap/issues/21)) |

## Team & access

| Feature | Status | Notes |
|---|---|---|
| Edit team member (name, phone, role, active status) | ✅ | Blocked in demo mode with a clear message; owner-only |
| Invite team member (real login + farm access) | ✅ | Owner enters name/email/role → `invite-user` Edge Function upserts a `farm_users` row and sends a real Supabase invite email; the invitee sets a password on `/accept-invite` and is linked to the farm via a self-claim RLS policy. Pending invites show a "Pending" badge until claimed |
| Roles (owner/manager/operator/agronomist/accountant/readonly) | ✅ | Enforced server-side — every operational table has read/write RLS policies driven by `has_farm_permission()`, not just a display label. Mirrored client-side in `src/lib/permissions.ts` to hide actions a role can't perform |
| Per-user custom permission overrides | 🚧 | `farm_users.custom_permissions` (JSONB) and the enforcement logic ship now — a sparse per-resource override checked before role defaults. No owner/staff-facing UI to edit it yet ([#23](https://github.com/AndrewMommers/FarmMap/issues/23)) |
| My Profile (avatar, name, phone) | ✅ | |

## Account & authentication

| Feature | Status |
|---|---|
| Email/password sign in & sign up | ✅ |
| Forgot password / reset flow | ✅ |
| Social login / SSO | ❌ Not started |
| Multi-factor authentication | ❌ Not started |

## Tractor Mode / GPS / geofencing

| Feature | Status |
|---|---|
| Device registration, revocation, reactivation | ✅ |
| Live GPS tracking (foreground, Tractor Mode only) | ✅ |
| Geofence enter/exit alerts + history | ✅ |
| Team directory with tap-to-call | ✅ |
| Live position on the paddock map | ✅ |

## Integrations

| Feature | Status | Notes |
|---|---|---|
| John Deere — OAuth connect/disconnect/sync | ⚠️ | Fully wired (frontend + Edge Functions + token storage) but resource paths/field mappings are best-effort from public docs, never run against a real account ([#11](https://github.com/AndrewMommers/FarmMap/issues/11)) |
| John Deere — paddock ↔ field boundary linking | ❌ | No UI to link a paddock to a boundary ID, so field sync currently has nothing to attach to ([#12](https://github.com/AndrewMommers/FarmMap/issues/12)) |
| Xero — OAuth connect/disconnect/sync | ⚠️ | Wired but unverified; account-code → category mapping not implemented ([#13](https://github.com/AndrewMommers/FarmMap/issues/13)) |
| Zepto — API-key connect/disconnect/sync | ⚠️ | Wired but unverified; payment amount units and GST treatment unconfirmed ([#14](https://github.com/AndrewMommers/FarmMap/issues/14)) |
| BOM Weather API, NLIS, MYOB, AgriWebb, GrainCorp | ❌ | Roadmap placeholders in Settings → Integrations only ("Connect" buttons are stubs) — not started |

## Notifications & messaging

| Feature | Status | Notes |
|---|---|---|
| Bell dropdown — live derived alerts (task overdue, low stock, equipment service) | ✅ | |
| Notification click-through | ✅ | Opens a quick-glance detail modal (full record + priority/status badges + quick actions like Mark Done) with a "View in Tasks/Inventory/Equipment" link that lands on that page pre-filtered |
| Live toast pop-ups for newly-appearing alerts | ✅ | Fires when an edit pushes a record into alert territory while the user is already in the app — not just sitting silently until the bell is checked |
| Browser/OS push notifications | ✅ | Via the Web Notifications API through the PWA service worker; gated behind a real, persisted per-category preference. Only works while the tab is open (even unfocused) — true background push (app fully closed) needs server-side push infrastructure (VAPID keys + a sending Edge Function), not built |
| Per-category notification preferences | ✅ | Task overdue / low stock / equipment service are real and enforced; rainfall events, livestock health, and budget overruns are honestly labelled "coming soon" — the toggles exist but nothing generates those alert types yet |
| Farm-wide announcements (team broadcast) | ✅ | Simple shared feed — anyone posts, everyone on the farm sees it, realtime via Supabase. No DMs, no threading (deliberately out of scope) |
| Farm Chat page | ✅ | A dedicated, roomier chat UI (message bubbles, own/others alignment, day dividers, auto-scroll) for the exact same announcements feed/backend — the bell dropdown's Announcements tab is the quick-glance version of the same data |
| Direct messages / threaded team chat | ❌ | Not started — explicitly deferred as a separate, bigger feature needing its own product decisions |

## Data management

| Feature | Status | Notes |
|---|---|---|
| Export all farm data as JSON | ✅ | |
| Import transactions from CSV | ✅ | |
| PWA / offline app shell | 🚧 | Configured via `vite-plugin-pwa`, but the manifest references icon files (`pwa-192x192.png`, `pwa-512x512.png`) that don't exist in `public/` — "Add to Home Screen" likely gets a broken/fallback icon ([#22](https://github.com/AndrewMommers/FarmMap/issues/22)) |

## Reliability & production readiness

| Feature | Status |
|---|---|
| Global error boundary (recoverable fallback on render errors) | ✅ |
| Row-level security on all farm data | ✅ |
| Automated test suite | ❌ Not started — no framework installed ([#15](https://github.com/AndrewMommers/FarmMap/issues/15)) |
| Error tracking / product analytics | ❌ Not started ([#16](https://github.com/AndrewMommers/FarmMap/issues/16)) |
| Billing / subscription | ❌ Not started — app is currently free-to-use with no plan gating ([#17](https://github.com/AndrewMommers/FarmMap/issues/17)) |

## Tracking

Every ❌/⚠️/🚧 item above with an issue number is tracked on [GitHub Issues](https://github.com/AndrewMommers/FarmMap/issues). See also [`docs/TODO.md`](TODO.md) for the original punch list and suggested order of attack, and [`docs/versions/`](versions/README.md) for the build history behind everything marked ✅.
