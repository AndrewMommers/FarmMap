# Portal — Outstanding Work

A punch list of what's incomplete in the authenticated app (as opposed to the public marketing site, which is up to date). Compiled by auditing the codebase and the open [GitHub issues](https://github.com/AndrewMommers/FarmMap/issues) — not a wishlist, everything here is a concrete, verifiable gap as of 2026-08-19. Every item below already has a tracked issue unless noted.

The original v1 of this list (stub buttons, missing forgot-password, no error boundary, a stale committed file) is fully resolved — see [`docs/versions/17`](versions/17-portal-completeness-and-notifications.md). What's left now is real integration verification, a few feature-completeness gaps, and the larger strategic items (tests, billing, analytics).

## 1. Third-party integrations — wired but unverified

John Deere, Xero and Zepto were built as complete OAuth/API-key plumbing (frontend hook, Edge Functions, token storage, RLS) but the actual request/response shapes are **best-effort mappings from public docs, not tested against a real account**.

- **John Deere** ([#11](https://github.com/AndrewMommers/FarmMap/issues/11)) — machine/field resource paths and field names need confirming against a real Developer Portal sandbox.
- **John Deere paddock ↔ field boundary linking UI** ([#12](https://github.com/AndrewMommers/FarmMap/issues/12)) — doesn't exist yet, so field-boundary sync currently has nothing to attach to.
- **Xero** ([#13](https://github.com/AndrewMommers/FarmMap/issues/13)) — account-code → category mapping isn't implemented; everything falls into "other income/expense."
- **Zepto** ([#14](https://github.com/AndrewMommers/FarmMap/issues/14)) — payment amount unit (cents vs. dollars) and GST treatment are unconfirmed.
- None of the three have been exercised against a live provider account end-to-end. Blocked on obtaining sandbox credentials, not on more code being written blind.

## 2. Feature-completeness gaps

- **Rainfall vs. long-term average** ([#20](https://github.com/AndrewMommers/FarmMap/issues/20)) — `avgRainfallMm` is hardcoded to 0 and never rendered; the landing page copy overclaims here.
- **Compliance documents** ([#21](https://github.com/AndrewMommers/FarmMap/issues/21)) — hardcoded mock list, no real per-farm storage/upload, "View" is a stub.
- **PWA manifest icons** ([#22](https://github.com/AndrewMommers/FarmMap/issues/22)) — references `pwa-192x192.png`/`pwa-512x512.png`, neither exists in `public/`.
- **Per-user custom permission overrides** ([#23](https://github.com/AndrewMommers/FarmMap/issues/23)) — the data model and RLS enforcement are live (`farm_users.custom_permissions`), but there's no owner-facing UI to actually set an override yet.
- **Staff Portal polish** ([#24](https://github.com/AndrewMommers/FarmMap/issues/24)) — no `staff_audit_log` viewer, no realtime ticket updates, tickets can only self-assign, no cross-tenant error dashboard, no pre-login error capture.

## 3. Account essentials still missing

- **No social/SSO login** — email+password only. Not yet tracked as an issue.
- **No MFA/2FA.** Not yet tracked as an issue.

## 4. Production-readiness gaps

- **Zero automated tests** ([#15](https://github.com/AndrewMommers/FarmMap/issues/15)) — no test framework installed, no `*.test.*`/`*.spec.*` files anywhere.
- **Error tracking / product analytics** ([#16](https://github.com/AndrewMommers/FarmMap/issues/16)) — 🚧 partial: client-side errors are now captured (`client_error_log`, surfaced per-farm to staff) as of the Staff Portal work. Usage/product analytics (funnels, feature adoption) still not started.
- **No billing/subscription system** ([#17](https://github.com/AndrewMommers/FarmMap/issues/17)) — the landing page implies a paid tier eventually; no Stripe integration, no pricing logic, no plan gating anywhere — the whole app is currently free-to-use.

## What's *not* on this list (already solid)

Worth naming so it's clear what was checked and passed: all core CRUD (paddocks, livestock, crops, equipment, finance, inventory, tasks), GPS tracking + geofencing, device registration/revocation, the responsive/mobile pass, Farm Chat/announcements, real team invitations with server-enforced role-based access control, a FarmMap Staff Portal + customer Support Centre, and clickable task detail pop-ups — all real, working, and covered by [version history](versions/README.md).

## Suggested order of attack

1. Integrations ([#11](https://github.com/AndrewMommers/FarmMap/issues/11)–[#14](https://github.com/AndrewMommers/FarmMap/issues/14)) — needs real developer-account access before this can move; still blocked on you obtaining sandbox credentials.
2. Feature-completeness gaps ([#20](https://github.com/AndrewMommers/FarmMap/issues/20)–[#24](https://github.com/AndrewMommers/FarmMap/issues/24)) — pick off by how often each is likely to be hit; the custom-permissions editor ([#23](https://github.com/AndrewMommers/FarmMap/issues/23)) and Staff Portal polish ([#24](https://github.com/AndrewMommers/FarmMap/issues/24)) are the most recently opened and probably most relevant right now.
3. SSO/MFA — worth a decision on whether these matter before wider customer rollout.
4. Tests, analytics, billing — larger, more strategic; worth a separate conversation about priority and scope before starting.
