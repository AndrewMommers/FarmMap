# 08 — Device registration & user profile

**Request:** "Lets implement a Device registration for the Tractor Mode... Lets also create our user profile and user settings and etc."

## What changed

- **`devices`** table added (`farm_id`, `name`, `assigned_user_id`, `status`, `last_active_at`, `last_location`, `last_location_at`), with farm-owner-only RLS.
- **`useDevices.ts`** — `registerThisDevice`, `forgetThisDevice`, `renameDevice`, `revokeDevice`, `reactivateDevice`, `assignDevice`, `removeDevice`. Device registration is explicitly *not* a second authentication system: a device only registers itself from an already-authenticated session on that device, and "revocation" is an app-layer forced sign-out rather than a hard credential revoke — documented honestly in `docs/DEVICES.md` rather than oversold.
- **`useDeviceRevocationGuard.ts`** — mounted once in `AppLayout`; checks the paired device against the device list on every refresh and signs the user out if it's been revoked.
- **Demo mode**: registering a device locally sets a paired-device marker with no real backend row (there's nothing to attach it to in demo mode), while still driving the same UI and GPS hook state so the demo stays fully explorable.
- **Settings page** gained a "Devices" tab (register/list/assign/revoke/reactivate/delete, last-known-location per device, a "Recent Geofence Activity" log) and a "My Profile" tab (editable avatar/name/phone, read-only email/role).
- `farm_users.user_id` linked to `auth.users(id)`; `ensureOwnerProfile` backfills the owner's profile row on load.

## Key files

- `src/hooks/useDevices.ts`, `useDeviceRevocationGuard.ts`
- `src/pages/SettingsPage.tsx`
- `src/store/dataStore.ts` (devices, geofenceEvents state + CRUD)
- `supabase/schema.sql`
- `docs/DEVICES.md`
