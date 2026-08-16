# John Deere Operations Center integration

Status: **architecture built, not yet connected to a live account.**

This lets a farm link their John Deere Operations Center account so machine
engine hours, GPS location and field boundaries sync into FarmMap's
Equipment and Paddocks. Nothing here talks to John Deere's real servers
until you've done the one-time setup below — until then the "Connect"
button in Settings → Integrations will fail with a clear "server
misconfigured" error rather than pretending to work.

## Why this needed a design decision, not just code

John Deere's Operations Center API requires:
1. A **John Deere Developer account** (free) at https://developer.deere.com
2. Registering an application and requesting the specific API products you
   need (Equipment API, Organizations API, Boundaries/Fields API) — John
   Deere reviews/approves this, it isn't instant
3. OAuth2 **Client ID/Secret** and exact endpoint URLs, issued per
   application from their developer portal

None of that can be done on your behalf — only the farm's John Deere account
owner can register the app and grant access. Everything below is written to
be filled in once you have those values, not hardcoded, because John Deere's
exact OAuth/API URLs are assigned per-application and have changed over time
(the platform is Okta-hosted).

## How the pieces fit together

```
Settings → Integrations "Connect"
        │
        ▼
john-deere-oauth-start  (Edge Function, requires login)
  → verifies you own the farm, returns a signed John Deere authorize URL
        │
        ▼
Browser redirects to John Deere → user logs in & approves scopes
        │
        ▼
John Deere redirects to john-deere-oauth-callback  (Edge Function, public)
  → exchanges the code for tokens, stores them in `integration_tokens`
    (service_role-only table — the browser/anon key can never read it),
    records status in `integration_connections` (readable by the farm owner)
  → redirects back to /settings
        │
        ▼
"Sync Now" → john-deere-sync  (Edge Function, requires login)
  → refreshes the access token if needed, pulls machines + fields,
    upserts into `equipment` / `paddocks` (matched via external_id /
    external_boundary_id so it never overwrites unrelated records)
```

Relevant files:
- `supabase/schema.sql` — `integration_connections`, `integration_tokens`,
  and the `external_provider`/`external_id` columns on `equipment` and
  `paddocks`
- `supabase/functions/_shared/john-deere.ts` — OAuth + API request helpers
- `supabase/functions/_shared/state.ts` — signs/verifies the OAuth `state`
  param (CSRF protection) using `STATE_SIGNING_SECRET`
- `supabase/functions/john-deere-oauth-start`
- `supabase/functions/john-deere-oauth-callback`
- `supabase/functions/john-deere-sync`
- `supabase/functions/john-deere-disconnect`
- `src/hooks/useIntegrations.ts` — frontend hook used by
  `src/pages/SettingsPage.tsx`

## Setup steps (once you have Developer Portal access)

1. **Register an app** at https://developer.deere.com. Request the
   Equipment, Organizations and Field Boundaries API products.
2. **Set the redirect URI** in your John Deere app registration to your
   deployed callback function's URL:
   `https://<project-ref>.supabase.co/functions/v1/john-deere-oauth-callback`
3. **Confirm the exact values** John Deere gives you for: the authorize
   endpoint, the token endpoint, the API base URL, and the scope names for
   the products you were approved for. These are per-application — copy
   them from your own dashboard, don't reuse ones from another app or from
   old blog posts.
4. **Set Supabase secrets** (`supabase secrets set ...` or via the
   Dashboard → Edge Functions → Secrets):
   ```
   JOHN_DEERE_CLIENT_ID=<from John Deere>
   JOHN_DEERE_CLIENT_SECRET=<from John Deere>
   JOHN_DEERE_AUTH_URL=<from John Deere>
   JOHN_DEERE_TOKEN_URL=<from John Deere>
   JOHN_DEERE_API_BASE_URL=<from John Deere, e.g. sandbox vs. production>
   JOHN_DEERE_REDIRECT_URI=https://<project-ref>.supabase.co/functions/v1/john-deere-oauth-callback
   JOHN_DEERE_SCOPES="<the scopes your app was approved for>"
   STATE_SIGNING_SECRET=$(openssl rand -hex 32)
   APP_BASE_URL=https://<your deployed FarmMap URL>
   ```
   `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are
   already provided automatically to Edge Functions — don't set those.
5. **Deploy the functions.** The callback must skip JWT verification since
   John Deere's browser redirect carries no Supabase session:
   ```
   supabase functions deploy john-deere-oauth-start
   supabase functions deploy john-deere-oauth-callback --no-verify-jwt
   supabase functions deploy john-deere-sync
   supabase functions deploy john-deere-disconnect
   ```
6. **Test against John Deere's sandbox first**, not production — their
   Developer Portal provides sandbox credentials and demo equipment/org data
   specifically so you can verify the flow without touching a real account.

## What still needs verification once you're testing against real data

The `TODO` comments in `supabase/functions/john-deere-sync/index.ts` and
`_shared/john-deere.ts` flag the specific parts that are a best-effort
mapping from John Deere's public docs, not a tested integration:
- Exact response shape of `/organizations`, `/organizations/{id}/machines`
  and `/organizations/{id}/fields` (field names, pagination, HAL links)
- The `Accept` media type / API version header
- Handling an account that belongs to **multiple** John Deere organisations
  (a contractor or agronomist, not just a single-farm owner) — the current
  code links the first org returned, which is a real limitation
- Token revocation on disconnect (currently just deletes the local copy —
  John Deere's revocation endpoint isn't called yet)

## What this deliberately does NOT do yet

- It does not auto-create new paddocks from John Deere field boundaries —
  only paddocks a user has explicitly linked to a `external_boundary_id`
  get updated, to avoid duplicating hand-drawn paddocks. A "link this
  paddock to a John Deere field" UI is a follow-up, not built.
- No scheduled/background sync — "Sync Now" is manual. A `pg_cron` job
  calling `john-deere-sync` on a schedule would be the natural next step.
- Only John Deere is scaffolded. Case IH/New Holland (CNH AFS Connect),
  Climate FieldView and Trimble Ag were explicitly left out of this pass —
  `provider` is already a typed union (`IntegrationProvider` in
  `src/types/index.ts`) specifically so adding one is additive, not a
  rewrite, when you're ready.
