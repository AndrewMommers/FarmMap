# Zepto Payments integration

Status: **architecture built, and the LEAST verified integration in this
codebase — read this whole file before wiring in a real API key.**

Zepto (zepto.com.au) is an Australian real-time bank payments / PayTo
platform. This scaffold syncs Zepto payments into FarmMap's Finance ledger
as transactions with a `pending`/`completed`/`failed` payment status.

## Why this is different from John Deere and Xero

John Deere and Xero are large platforms with long-stable, thoroughly public
OAuth2 documentation — a farmer signs into an account they already have, and
FarmMap requests access to it. Zepto is assumed here to work more like
Stripe: a business integrates it directly using an **API key issued from
their own Zepto merchant dashboard**, not a "sign in with Zepto" redirect.

**That assumption — and every endpoint path and field name below — has not
been confirmed against Zepto's actual developer documentation.** Before
connecting a real account:

1. Log into your Zepto merchant dashboard and find their actual API/developer
   docs (or contact Zepto support for API access if you don't have it yet).
2. Confirm the authentication model actually is an API key + Bearer token —
   if it's OAuth2 instead, `zepto-connect` needs to be rewritten to match
   the pattern in `john-deere-oauth-start`/`callback`, not the API-key
   pattern it uses now.
3. Confirm the real endpoint paths and replace the guessed defaults
   (`/merchant` for verification, `/payments` for listing payments) in
   `supabase/functions/_shared/zepto.ts` or via the `ZEPTO_VERIFY_PATH` /
   `ZEPTO_PAYMENTS_PATH` secrets.
4. Confirm the response field names in `ZeptoMerchantInfo` and
   `ZeptoPayment` (in `zepto-connect`/`zepto-sync`) — `id`, `status`,
   `direction`, `amount`, `counterparty.name` are guesses at a typical
   payments-API shape, not Zepto's confirmed schema.
5. Confirm what unit `amount` is in (dollars vs. cents) — this materially
   changes every synced transaction's value if guessed wrong.

## Setup steps (once the above is confirmed)

1. **Set Supabase secrets**:
   ```
   ZEPTO_API_BASE_URL=<Zepto's real API base URL>
   ZEPTO_VERIFY_PATH=<real path, if different from /merchant>
   ZEPTO_PAYMENTS_PATH=<real path, if different from /payments>
   ```
2. **Deploy**:
   ```
   supabase functions deploy zepto-connect
   supabase functions deploy zepto-sync
   supabase functions deploy zepto-disconnect
   ```
3. In FarmMap, go to Settings → Integrations → Zepto → Connect, and paste
   in the API key from your Zepto merchant dashboard. `zepto-connect` will
   call the verify endpoint immediately and refuse to save an invalid key.

## What this deliberately does NOT do yet

- No webhook handler for real-time payment status updates — "Sync Now" is
  a manual pull. If Zepto supports webhooks (most payment platforms do),
  that would be a much better source of truth than polling, and is worth
  building once the API is confirmed.
- No token/key rotation or revocation call to Zepto on disconnect — it just
  stops using the stored key locally.
- GST handling is left blank (`gst_included: false`) on every synced
  payment, because a raw bank payment doesn't carry enough information to
  know what it was for — that has to be set manually in FarmMap.
