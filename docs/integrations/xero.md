# Xero Accounting integration

Status: **architecture built, not yet connected to a live account.**

Pulls recent bank transactions from Xero into FarmMap's Finance ledger so
income/expense reporting reflects what's actually in the books, without
re-keying every transaction by hand.

This is a **one-directional pull** (Xero → FarmMap), not a full
bidirectional accounting sync. Pushing FarmMap transactions back into Xero,
and reconciling edits made on both sides, is a much bigger design problem
(conflict resolution, chart-of-accounts mapping) that isn't built here.

## Setup steps

1. **Register an app** at https://developer.xero.com/app/manage (free).
   Choose "Web app" (Authorization Code flow).
2. **Set the redirect URI** in your Xero app to your deployed callback
   function's URL:
   `https://<project-ref>.supabase.co/functions/v1/xero-oauth-callback`
3. **Set Supabase secrets**:
   ```
   XERO_CLIENT_ID=<from Xero>
   XERO_CLIENT_SECRET=<from Xero>
   XERO_REDIRECT_URI=https://<project-ref>.supabase.co/functions/v1/xero-oauth-callback
   STATE_SIGNING_SECRET=$(openssl rand -hex 32)   # can reuse the same one as John Deere
   APP_BASE_URL=https://<your deployed FarmMap URL>
   ```
   Xero's OAuth endpoints, connections endpoint and API base URL are
   well-documented and fixed (unlike John Deere's per-app URLs), so
   `supabase/functions/_shared/xero.ts` defaults them for you. Override
   with `XERO_AUTH_URL` / `XERO_TOKEN_URL` / `XERO_CONNECTIONS_URL` /
   `XERO_API_BASE_URL` / `XERO_SCOPES` only if you need to.
4. **Deploy**:
   ```
   supabase functions deploy xero-oauth-start
   supabase functions deploy xero-oauth-callback --no-verify-jwt
   supabase functions deploy xero-sync
   supabase functions deploy xero-disconnect
   ```
5. **Test against the Xero Demo Company** first — every Xero developer
   account gets one for free, with realistic sample data, so you can verify
   the sync before connecting a real set of books.

## What still needs verification once you're testing against real data

Flagged with `TODO` in `supabase/functions/xero-sync/index.ts`:
- **Currency**: `BankTransactions.Total` is in the organisation's base
  currency. This assumes AUD — check your org's currency setting.
- **Dates**: some Xero API responses wrap dates as `/Date(ms+tz)/` rather
  than plain ISO8601; `parseXeroDate()` handles both, but confirm what your
  actual sandbox returns.
- **Category mapping**: Xero has no equivalent of FarmMap's fixed
  `TransactionCategory` enum — it uses a chart-of-accounts `AccountCode`.
  Everything currently lands in `other_income` / `other_expense`. Mapping
  specific account codes to FarmMap categories (e.g. an account named "Fuel"
  → `fuel`) is the natural next step, and depends on your chart of accounts.
- **Multiple organisations**: a Xero login can be connected to more than one
  org (e.g. a bookkeeper). This scaffold links the first one returned —
  fine for a farm with one set of books, not for someone managing several.
  A tenant-picker UI is a follow-up, not built.

## What this deliberately does NOT do yet

- No writing back to Xero (creating/updating transactions there).
- No scheduled/background sync — "Sync Now" is manual.
- No invoice/contact sync, only bank transactions.
