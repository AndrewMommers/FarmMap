# 03 — John Deere integration

**Request:** "Can we integrate with John Deere? and other tractor technology for cross support and better accurate reporting."

Scoped after clarifying with the user: scaffold the integration now, wire up live sync later; John Deere only for the first platform.

## What changed

- `integration_connections` and `integration_tokens` tables added to `supabase/schema.sql`, generic across providers so Xero/Zepto ([04](04-xero-zepto-integration.md)) could reuse the same shape.
- **Security-sensitive design**: `integration_tokens` has *no* RLS policies at all — default-deny for `anon`/`authenticated`, only the `service_role` (used by Edge Functions) can read or write tokens. Tokens never reach the browser.
- Supabase Edge Functions (Deno) per the standard OAuth pattern:
  - `john-deere-oauth-start` (JWT-verified) — builds a signed authorize URL.
  - `john-deere-oauth-callback` (public, `--no-verify-jwt`) — exchanges the code, stores tokens via `service_role`.
  - `john-deere-sync`, `john-deere-disconnect`.
  - `_shared/state.ts` — HMAC-SHA256-signed OAuth `state` binding both `farmId` and the provider name, to prevent CSRF and cross-provider confusion.
  - `_shared/john-deere.ts` — provider-specific helpers.
- `Equipment` and `Paddock` types extended with telemetry / external-boundary fields (`externalProvider`, `externalBoundaryId`) so synced data can be distinguished from manually entered data.
- Documented in `docs/integrations/john-deere.md`.

## Key files

- `supabase/functions/john-deere-oauth-start/`, `john-deere-oauth-callback/`, `john-deere-sync/`, `john-deere-disconnect/`
- `supabase/functions/_shared/state.ts`, `_shared/john-deere.ts`
- `supabase/schema.sql`
- `docs/integrations/john-deere.md`
