# 19 — Staff Portal, Support Centre, and client error logging

**Requests:** "Lets look into the FarmApp Staff Portal, so we can provide IT Support to our customers" → (scoped via Q&A) "Read + limited fixes" access, staff added via "Allowlist" → "Lets do external and internal. External can only be added by a certain role permission (e.g. Administrator)" → "Looking good, but lets also look into our own support centre, ticket system and etc" → "Ok, looking good, lets look into logs for customers and so on, so we can see what issues and etc the customer may be having."

Closes [#19](https://github.com/AndrewMommers/FarmMap/issues/19) (already closed by v18). Opens [#24](https://github.com/AndrewMommers/FarmMap/issues/24) for deferred polish. Comments progress on [#16](https://github.com/AndrewMommers/FarmMap/issues/16) (error tracking).

## The core design decision: staff access never touches customer RLS

Three sequential asks turned this into three coupled features — a Staff Portal (IT support for customers), a Support Centre (tickets), and client-side error logging (so staff can see what actually broke, not just what a customer describes). All three share one architectural rule: **staff never get an `OR is_platform_staff()` bypass added to any existing customer-facing RLS policy.**

The reason is concrete, not stylistic: the project owner (and any future staff member) is also a real customer who loads their own farm through `dataStore.loadFromSupabase`'s bulk path (`SELECT * FROM farms`, filtered only by RLS — no client-side `.eq('user_id', ...)`, deliberately removed in v18 so invited members could see farms they don't own). Loosening `farms_read` for staff would leak every customer's farm into a staff member's own ordinary dashboard load. So every staff action instead goes through one new Edge Function, `staff-portal`, using a `service_role` admin client with narrow, explicit per-action queries — same shape as `invite-user` from v18.

## Staff identity: `platform_staff`, two tiers, zero client RLS

A new table, RLS-enabled with **no client-facing policies at all** (same pattern as the pre-existing `integration_tokens`) — only the `staff-portal` function, via `service_role`, ever touches it:

- `tier`: `internal` (seeded directly via migration — `andrew.mommers@gmail.com` bootstrapped as the first internal Administrator) or `external` (can only be added through the portal by someone with `is_admin = true`). Same capability once granted either way — the tier only gates who's allowed to add them.
- `active` boolean, no hard deletes.

Staff actions: `whoami`, `search_farms` (name/owner/team-member-email), `get_farm_detail` (roster + basic counts), `resend_invite`, `toggle_user_active`, `change_user_role` (restricted to the same non-owner role list `invite-user` already uses — staff can never grant owner-equivalent access), `add_external_staff` / `deactivate_staff` (admin-only), `list_staff`.

## Support Centre: customer-facing, uses RLS like `announcements` does

`support_tickets` + `support_ticket_messages` — any active farm member can raise/read/reply to their own farm's tickets, same "open within the farm" reasoning as `announcements_access`. Staff read/reply across every farm's queue exclusively through `staff-portal` (`list_tickets`, `get_ticket`, `reply_ticket`, `update_ticket_status`, `assign_ticket` — self-assign only for now). New customer-facing page `/support`, added to the normal Sidebar nav; staff work the same data from a "Tickets" tab in the hidden `/staff` portal.

## Client error logging — and the second RLS gotcha this session

`ErrorBoundary.componentDidCatch` plus new global `window.onerror`/`unhandledrejection` listeners now call `logClientError()`, which inserts into `client_error_log`. First deploy attempt made it insert-only for customers (no SELECT policy — "customers never need to read this back"), which seemed obviously safe. It wasn't: **Postgres RLS requires a freshly-inserted row to also pass an applicable SELECT policy, not just the INSERT policy's own `WITH CHECK`** — confirmed by reproducing the failure with a rolled-back direct-SQL simulation, then confirming a `WITH CHECK (true)` policy *still* failed until a permissive SELECT policy was added alongside it. This is the same underlying RLS behavior (in the opposite direction) as v18's `farm_users_claim_own_invite` bug, where `UPDATE` needed a SELECT-policy pass too. Fixed by adding `client_error_log_read USING (user_id = auth.uid())` — customers can read back their own error rows, which is harmless (it's their own diagnostic data); staff still read across every customer only through `staff-portal`.

## Verification

Tested against the live Supabase project end-to-end using a real, legitimately-minted session for the project owner's own account (via the Admin API's magic-link generation — no password needed, no third-party account touched): `whoami`, farm search/detail, the full ticket lifecycle (create as customer → appears in staff queue → staff reply → status change → self-assign → thread shows both messages), add/list/deactivate external staff, a real client-error insert appearing in that farm's Accounts-tab "Recent Errors," and a malformed-token request correctly rejected (401). All temporary test data and scratch scripts were cleaned up afterward; no state was left behind on the real account.

## Key files

- `supabase/schema.sql` — `platform_staff`, `staff_audit_log`, `support_tickets`, `support_ticket_messages`, `client_error_log`
- `supabase/functions/staff-portal/index.ts` (new)
- `src/pages/staff/StaffPortalPage.tsx` (new), `src/App.tsx` — `/staff` route (intercepted before onboarding, since a staff-only account may have no farm of its own)
- `src/pages/SupportPage.tsx` (new), `src/App.tsx` + `src/components/layout/Sidebar.tsx` — `/support` route + nav item
- `src/lib/errorLogging.ts` (new), `src/components/ErrorBoundary.tsx`, `src/main.tsx`
- `src/store/dataStore.ts`, `src/types/index.ts`, `src/hooks/useFarmData.ts` — `SupportTicket`/`TicketMessage` state
