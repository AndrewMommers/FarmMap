// Shared Zepto (zepto.com.au — Australian real-time bank payments / PayTo)
// config + helpers for Edge Functions.
//
// CONFIDENCE WARNING: this is the least-verified integration in the
// codebase. Unlike John Deere and Xero, which are large platforms with
// long-stable, thoroughly public API documentation, Zepto is a newer
// merchant payments platform and its exact authentication model, endpoint
// paths and payload shapes are NOT confirmed here — everything below is a
// best-effort scaffold based on how most REST payment-processor APIs work
// (an API key issued from a merchant dashboard, sent as a Bearer token),
// not a verified integration. Confirm every one of these against
// https://zepto.com.au's actual developer documentation / your merchant
// dashboard before relying on it, and expect to adjust field names.
//
// Also note the auth model is deliberately different from John Deere/Xero:
// those are OAuth2 "connect your existing account" flows because a farmer
// already has a JD/Xero login. Zepto is modelled here as a payment
// processor a business integrates directly, the way you'd integrate
// Stripe — you paste in an API key issued from your own Zepto merchant
// dashboard, there's no "sign in with Zepto" redirect. If Zepto's real
// integration model turns out to be OAuth-based instead, this file (and
// zepto-connect) is the only place that needs to change — the rest of the
// architecture (integration_connections / integration_tokens / sync
// pattern) is provider-agnostic.
//
// Set secrets with:
//   supabase secrets set \
//     ZEPTO_API_BASE_URL=... \
//     ZEPTO_VERIFY_PATH=/merchant \
//     ZEPTO_PAYMENTS_PATH=/payments

export interface ZeptoConfig {
  apiBaseUrl: string;
  verifyPath: string;
  paymentsPath: string;
}

export function loadZeptoConfig(): ZeptoConfig {
  const env = Deno.env;
  const required = (key: string) => {
    const v = env.get(key);
    if (!v) throw new Error(`Missing required secret: ${key}. See docs/integrations/zepto.md.`);
    return v;
  };
  return {
    apiBaseUrl: required('ZEPTO_API_BASE_URL'),
    verifyPath: env.get('ZEPTO_VERIFY_PATH') ?? '/merchant',
    paymentsPath: env.get('ZEPTO_PAYMENTS_PATH') ?? '/payments',
  };
}

/** Authenticated request against the Zepto API using a merchant API key. */
export async function zeptoFetch<T = unknown>(cfg: ZeptoConfig, apiKey: string, path: string): Promise<T> {
  const res = await fetch(`${cfg.apiBaseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Zepto API request failed (${path}): ${res.status} ${await res.text()}`);
  return res.json();
}
