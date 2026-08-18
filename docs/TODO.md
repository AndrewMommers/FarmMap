# Portal — Outstanding Work

A punch list of what's incomplete in the authenticated app (as opposed to the public marketing site, which is up to date). Compiled by auditing the codebase for stub buttons, unwired features, and structural gaps — not a wishlist, everything here is a concrete, verifiable gap as of 2026-08-18.

## 1. Stubbed actions — buttons that exist but just show a toast

These are real UI elements a user can click; right now they all fire `toast('… coming soon')` instead of doing anything.

- **Paddocks** — "View Log" and "Spray record" quick actions (`PaddocksPage.tsx`, two locations each: list view and detail view)
- **Livestock** — "Record Movement" and "Add Treatment" (`LivestockPage.tsx`)
- **Crops** — "Record Yield" (`CropsPage.tsx`)
- **Equipment** — "Log Service" (`EquipmentPage.tsx`)
- **Compliance** — "Export register" (`CompliancePage.tsx`) — note: the *generic* Reports page CSV/PDF export already works for real; this is specifically the compliance register's own export button
- **Settings → Users & Access** — "Edit user" (`SettingsPage.tsx`)
- **Settings → Data** — "Export JSON" and "Import CSV" (`SettingsPage.tsx`)

## 2. Third-party integrations — wired but unverified

John Deere, Xero and Zepto were built as complete OAuth/API-key plumbing (frontend hook, Edge Functions, token storage, RLS) but the actual request/response shapes are **best-effort mappings from public docs, not tested against a real account**. Each sync function has a code comment saying so explicitly.

- **John Deere** (`supabase/functions/john-deere-sync`) — machine/field resource paths and field names need confirming against a real Developer Portal sandbox.
- **Xero** (`supabase/functions/xero-sync`) — `BankTransactions` category mapping is a guess (`account code → category` isn't implemented, everything currently falls into "other income/expense").
- **Zepto** (`supabase/functions/zepto-sync`) — payment amount unit (cents vs dollars) and GST treatment are unconfirmed; this is a smaller, less-standardised API than the other two.
- **Paddock ↔ John Deere field boundary linking UI doesn't exist yet.** The sync function will only update a paddock that's already linked to an `external_boundary_id`, but there's no screen to create that link — so in practice, field-boundary sync currently does nothing until this is built.
- None of the three have been exercised against a live provider account end-to-end.

## 3. Account essentials that are missing

- **No "Forgot password" flow.** `AuthPage.tsx` only wires up sign-in and sign-up; `authStore.ts` has no password-reset action at all.
- **No social/SSO login** — email+password only.
- **No MFA/2FA.**

## 4. Production-readiness gaps

- **Zero automated tests.** No test framework is installed (`package.json` has no `vitest`/`jest`/`playwright`), no `*.test.*` or `*.spec.*` files exist anywhere in the repo.
- **No React error boundary.** An unhandled render error in any page will white-screen the whole app rather than showing a fallback.
- **No error tracking or product analytics** — no Sentry/LogRocket-style monitoring, no usage analytics. You'd have no visibility into real-user errors post-launch.
- **No billing/subscription system.** The landing page's "Start Free" implies a paid tier exists eventually, but there's no Stripe (or equivalent) integration, no pricing logic, no plan gating anywhere in the code — the whole app is currently free-to-use with no monetisation path.

## 5. Repo hygiene

- **`src/pages/SettingsPage.tsx.tmp`** is a stale, committed leftover (293 lines vs. the real file's 905) — an old pre-devices/pre-profile snapshot of `SettingsPage.tsx` that's tracked in git but never imported anywhere. Safe to delete.

## What's *not* on this list (already solid)

Worth naming so it's clear what was checked and passed: the generic Reports page CSV/PDF export, GPS tracking + geofencing, device registration/revocation, the responsive/mobile pass, and all core CRUD (paddocks, livestock, crops, equipment, finance, inventory, tasks) are real, working, and already covered by prior [version history entries](versions/README.md).

## Suggested order of attack

1. Repo hygiene (delete the `.tmp` file) — trivial, no reason to leave it.
2. Forgot-password flow — small, but a real gap in a product people will actually rely on.
3. Stub buttons — pick off by how often each record type is used day-to-day (Paddocks/Livestock likely first).
4. Error boundary — small effort, meaningfully reduces blast radius of any future bug.
5. Integrations — needs real developer-account access for John Deere/Xero/Zepto before this can move; blocked on you obtaining sandbox credentials, not on more code being written blind.
6. Tests, monitoring, billing — larger, more strategic; worth a separate conversation about priority and scope before starting.
