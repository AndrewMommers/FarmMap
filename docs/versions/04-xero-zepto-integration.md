# 04 — Xero & Zepto integration

**Request:** "Lets also support Zepto and xero for finance side."

## What changed

- **Xero** (accounting): same OAuth pattern as John Deere — `xero-oauth-start`, `xero-oauth-callback`, `xero-sync`, `xero-disconnect`, `_shared/xero.ts`. Bank transactions sync into the Finance ledger.
- **Zepto** (Australian real-time payments / PayTo): an API-key model rather than OAuth — `zepto-connect`, `zepto-sync`, `zepto-disconnect`, `_shared/zepto.ts`.
- `Transaction` type extended with `externalProvider?`, `externalId?`, `paymentStatus?` so synced transactions can be reconciled against manual entries.
- Both providers reuse the `integration_connections` / `integration_tokens` tables and the zero-RLS token-storage pattern from [03](03-john-deere-integration.md).
- Documented in `docs/integrations/xero.md` and `docs/integrations/zepto.md`.

## Key files

- `supabase/functions/xero-oauth-start/`, `xero-oauth-callback/`, `xero-sync/`, `xero-disconnect/`
- `supabase/functions/zepto-connect/`, `zepto-sync/`, `zepto-disconnect/`
- `supabase/functions/_shared/xero.ts`, `_shared/zepto.ts`
- `docs/integrations/xero.md`, `docs/integrations/zepto.md`
