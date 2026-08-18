# 18 — Real team invitations with role-based access control

**Requests:** "lets do invitation" → (scoped via clarifying question) "Real invite: they get their own login + farm access" → "Looks good, but lets dive into the role-based enforcement and security" → "Looks better, but maybe if we can make it so FarmApp staff/Developers can change that User's Farm roles to custom ones if needed??? Also, make this part of the full thing, but coming soon to release. I want everyone to experience it".

Closes [#19](https://github.com/AndrewMommers/FarmMap/issues/19). Opens [#23](https://github.com/AndrewMommers/FarmMap/issues/23) as a tracked follow-up.

## Why this was a bigger change than "add a button"

Every RLS policy in the database was `farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())` — owner-only, on every table, with zero exceptions. A real second login for a teammate needed a full access-model rewrite, not just an insert into `farm_users`. And roles (`manager`/`operator`/`agronomist`/`accountant`/`readonly`) already existed as a field but were purely a display label — nothing checked them. The user explicitly asked for that to become real enforcement, not just UI.

## Role permission matrix

A resource (11 groupings) × role (5 non-owner roles) grid — `read`/`write`/`none` per cell. Owner always has full access. Encoded once in Postgres, mirrored in TypeScript for UI reflection. See the table in `supabase/schema.sql`'s `has_farm_permission()` comment, or `src/lib/permissions.ts`.

## Enforcement (the actual security boundary)

Two new `SECURITY DEFINER` Postgres functions:
- `get_farm_role(farm_id)` — `'owner'` if you own the farm, else your `farm_users.role` if you're an active member, else `NULL`.
- `has_farm_permission(farm_id, resource, action)` — resolves the matrix above, checking a per-user `custom_permissions` JSONB override first.

Every operational table now has **two** RLS policies (read/write) driven by these functions, instead of one owner-only policy. Permissive policies OR together, so write-capable roles automatically satisfy read.

## Per-user custom permission overrides — data model ships, editing UI deferred

`farm_users.custom_permissions JSONB` — a sparse `{resource: 'read'|'write'|'none'}` map checked before the role-matrix fallback. This shipped live per direct instruction ("make this part of the full thing... I want everyone to experience it"), but the owner-facing screen to actually *edit* someone's overrides is intentionally out of scope for this pass — tracked as [#23](https://github.com/AndrewMommers/FarmMap/issues/23).

## The invite flow

- Owner clicks "Invite User" in Settings → Users & Access (owner-only button now), fills in name/email/role.
- `invite-user` Edge Function verifies the caller truly owns the farm (RLS-visibility alone isn't enough now that members can SELECT farms too), upserts a pending `farm_users` row, and sends a real Supabase invite email.
- The invitee opens the email, lands on `/accept-invite` (new special-cased route, same pattern as `/reset-password`), sets a password, and a new `farm_users_claim_own_invite` RLS policy lets them self-link their login to the row matching their own verified JWT email — no second privileged round-trip needed.
- Pending (unclaimed) team members show a "Pending" badge in the team list.

## Bug fixed along the way

`dataStore.ensureOwnerProfile`'s fallback used to create a new `farm_users` row with `role: 'owner'` whenever it couldn't find an existing match — harmless while only owners could ever see a farm, but a real privilege-escalation risk now that invited members can see farms they don't own. Fixed to only grant `'owner'` when the signed-in user actually is `farms.user_id`; everyone else defaults to `'operator'`.

## UI gating

`src/lib/permissions.ts` mirrors the matrix client-side (`canRead`/`canWrite`/`useMyRole`/`useCanWrite`) — used to hide (not just disable) Add/Edit/Delete actions across Paddocks, Livestock, Crops, Equipment, Finance, Inventory, Tasks, and Settings (Integrations, Devices, Invite/Edit User). This is UX only; RLS is what actually blocks a disallowed write.

## Key files

- `supabase/schema.sql` — `farm_users.custom_permissions`, `get_farm_role()`, `has_farm_permission()`, full RLS rewrite, `farm_users_claim_own_invite`
- `supabase/functions/invite-user/index.ts` (new)
- `src/pages/auth/AcceptInvitePage.tsx` (new), `src/App.tsx` — `/accept-invite` route
- `src/components/modals/InviteUserModal.tsx` (new)
- `src/lib/permissions.ts` (new)
- `src/types/index.ts` — `Farm.userId`, `PermissionResource`, `PermissionLevel`, `User.customPermissions`
- `src/store/dataStore.ts` — `addFarm`, `loadFromSupabase`, `ensureOwnerProfile`
- `src/pages/SettingsPage.tsx`, `PaddocksPage.tsx`, `LivestockPage.tsx`, `CropsPage.tsx`, `EquipmentPage.tsx`, `FinancePage.tsx`, `InventoryPage.tsx`, `TasksPage.tsx` — permission gating
