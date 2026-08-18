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

| Feature | Status |
|---|---|
| Chemical use register (built from spray records) | ✅ |
| Withholding-period (WHP) tracker & alerts | ✅ |
| Register PDF export | ✅ |
| Regulatory document list (MSDS, PIC, licences) | ✅ (static reference list, not user-uploadable) |

## Team & access

| Feature | Status | Notes |
|---|---|---|
| Edit team member (name, phone, role, active status) | ✅ | Blocked in demo mode with a clear message |
| Invite / add team member | ❌ | `addUser` exists in the data layer but nothing in the UI calls it — button still says "coming in full release" ([#19](https://github.com/AndrewMommers/FarmMap/issues/19)) |
| Roles (owner/manager/operator/agronomist/accountant/readonly) | ✅ | Defined and editable, not yet permission-enforced beyond display |
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

## Data management

| Feature | Status |
|---|---|
| Export all farm data as JSON | ✅ |
| Import transactions from CSV | ✅ |
| PWA / offline app shell | ✅ (configured via `vite-plugin-pwa`) |

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
