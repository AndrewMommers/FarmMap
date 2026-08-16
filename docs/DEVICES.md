# Device registration (Tractor Mode)

Lets a farm name and manage the tablets/phones set up in tractor cabs, so
they launch straight into Tractor Mode and can be revoked centrally if one
goes missing. Settings → Devices.

## The security model, honestly

This is **device management, not a second authentication system.**

FarmMap's whole data model is single-owner-auth: every table's Row Level
Security policy checks `farm_id IN (SELECT id FROM farms WHERE user_id =
auth.uid())` — i.e. access is controlled entirely by the signed-in Supabase
Auth session, and there's currently no way for a teammate to have their own
distinct login (the `farm_users` table is a team *directory* — contacts,
roles, phone numbers — not a set of accounts).

Given that, "registering a device" deliberately does **not** try to invent a
separate device-level credential. Instead:

- Registration only happens **from an already-authenticated session, on the
  device itself** (Settings → Devices → "Register This Device"). There's no
  remote pairing-code flow, on purpose — it would either require someone to
  already be logged in on that device anyway, or require minting some new
  kind of scoped credential, which is a materially bigger and more
  security-sensitive piece of work than what was asked for here.
- A registered device is a named row (`devices` table) plus a local
  `localStorage` marker on that browser. It controls two things: whether
  the app auto-launches into Tractor Mode on that browser, and whether it
  shows up in the farm owner's device list.
- **"Revoking" a device is an app-layer control**, checked by
  `useDeviceRevocationGuard` (mounted once, in `AppLayout`) every time the
  device list refreshes: if this browser's paired device is marked
  `revoked`, it forces a Supabase sign-out and forgets the local pairing.
  It does **not** revoke a separate credential, because there isn't one —
  the browser was always using the same Supabase session as anyone else
  logged into that account. A user who still has that account's real
  password could simply log back in on the same device. Revoking is best
  understood as "kick this browser out and stop showing it as trusted,"
  not "cryptographically cut off access."

If a farm genuinely needs per-operator logins with independently revocable
credentials (so revoking a device is a hard guarantee, not a soft one),
that's a real multi-user-auth feature — giving each `farm_users` row its own
Supabase Auth account and rewriting the RLS policies around a
farm-membership table instead of `farms.user_id`. That's a substantially
bigger change than device registration and hasn't been built here.

## What's actually built

- `devices` table (`supabase/schema.sql`) — `name`, `assigned_user_id`
  (optional link to a `farm_users` row), `status` (`active`/`revoked`),
  `last_active_at`. RLS: farm-owner only, same pattern as every other table.
- `farm_users.user_id` — links a team-directory row to a real
  `auth.users.id`, added so "My Profile" (Settings) has a row to edit. Farms
  created before this migration get their owner's row auto-provisioned by
  `ensureOwnerProfile` (`src/store/dataStore.ts`), called once from
  `App.tsx` after data loads.
- `src/lib/device.ts` — reads/writes the local pairing marker.
- `src/hooks/useDevices.ts` — register / rename / assign / revoke /
  reactivate / remove, used by Settings → Devices.
- `src/hooks/useDeviceRevocationGuard.ts` — the enforcement effect described
  above. Mount this **once** (it already is, in `AppLayout`) — mounting it
  per-component would fire the sign-out redundantly from multiple places.
- Tractor Mode (`TractorModeOverlay.tsx`) gained **Map** and **Team** tabs
  alongside the existing Overview:
  - **Map** embeds the same `FarmMapLeaflet` component used on the Paddocks
    page, read-only (no drawing tools), so the cab gets an actual live
    paddock map instead of just a "Paddocks" shortcut button.
  - **Team** shows the farm's own `farm_users` roster (name, role,
    tap-to-call phone) — nothing from other farms, since `useFarmData()` is
    already scoped to the active farm and RLS enforces that boundary at the
    database level regardless.

## What this deliberately does NOT do

- No live GPS location sharing between team members. "See other users" is a
  team *directory* (who's on the team, their role, how to call them), not
  real-time presence or location tracking — that's a materially different,
  privacy-sensitive feature that wasn't asked for and isn't built.
- No remote/QR-code pairing flow (see above).
- No hard credential revocation — see the security model section.
- Demo mode fakes a local pairing (so the registration flow is explorable)
  but never writes a real `devices` row — there's no backend to write to in
  demo mode.
