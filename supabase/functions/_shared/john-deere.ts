// Shared John Deere Operations Center API config + helpers for Edge Functions.
//
// IMPORTANT: John Deere's OAuth endpoints, API base URL and scope names are
// assigned per-application in the John Deere Developer Portal
// (https://developer.deere.com) and do change over time (the platform is
// hosted on an Okta-based authorization server whose exact URLs are issued
// per app). Nothing is hardcoded here — every value is read from a Supabase
// secret, both so this scaffold survives John Deere changing an endpoint and
// so nothing below is presented as "verified correct" without you having
// confirmed it against your own app registration and sandbox.
//
// Set secrets with:
//   supabase secrets set \
//     JOHN_DEERE_CLIENT_ID=... \
//     JOHN_DEERE_CLIENT_SECRET=... \
//     JOHN_DEERE_AUTH_URL=... \
//     JOHN_DEERE_TOKEN_URL=... \
//     JOHN_DEERE_API_BASE_URL=... \
//     JOHN_DEERE_REDIRECT_URI=... \
//     JOHN_DEERE_SCOPES="ag1 ag2 ag3 eq1 org1 offline_access" \
//     STATE_SIGNING_SECRET=$(openssl rand -hex 32) \
//     APP_BASE_URL=https://yourapp.example
//
// See docs/integrations/john-deere.md for the full setup walkthrough and
// which values come from the Developer Portal vs. ones you invent yourself.

export interface JohnDeereConfig {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  apiBaseUrl: string;
  redirectUri: string;
  scopes: string;
  appBaseUrl: string;
}

export function loadJohnDeereConfig(): JohnDeereConfig {
  const env = Deno.env;
  const required = (key: string) => {
    const v = env.get(key);
    if (!v) throw new Error(`Missing required secret: ${key}. See docs/integrations/john-deere.md.`);
    return v;
  };
  return {
    clientId: required('JOHN_DEERE_CLIENT_ID'),
    clientSecret: required('JOHN_DEERE_CLIENT_SECRET'),
    authUrl: required('JOHN_DEERE_AUTH_URL'),
    tokenUrl: required('JOHN_DEERE_TOKEN_URL'),
    apiBaseUrl: required('JOHN_DEERE_API_BASE_URL'),
    redirectUri: required('JOHN_DEERE_REDIRECT_URI'),
    scopes: env.get('JOHN_DEERE_SCOPES') ?? 'ag1 ag2 ag3 eq1 org1 offline_access',
    appBaseUrl: required('APP_BASE_URL'),
  };
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number; // seconds
  token_type: string;
  scope?: string;
}

async function requestToken(cfg: JohnDeereConfig, params: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${cfg.clientId}:${cfg.clientSecret}`)}`,
    },
    body: new URLSearchParams(params),
  });
  if (!res.ok) {
    throw new Error(`John Deere token request failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export function exchangeCodeForTokens(cfg: JohnDeereConfig, code: string): Promise<TokenResponse> {
  return requestToken(cfg, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: cfg.redirectUri,
  });
}

export function refreshAccessToken(cfg: JohnDeereConfig, refreshToken: string): Promise<TokenResponse> {
  return requestToken(cfg, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
}

/**
 * Authenticated GET against the John Deere Operations Center API.
 * TODO: confirm the `Accept` media type and response envelope (John Deere
 * uses a versioned HAL+JSON convention, e.g. `application/vnd.deere.axiom.v3+json`)
 * against the current API docs for your registered application — this can
 * change per resource and per API version.
 */
export async function jdFetch<T = unknown>(cfg: JohnDeereConfig, accessToken: string, path: string): Promise<T> {
  const res = await fetch(`${cfg.apiBaseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.deere.axiom.v3+json',
    },
  });
  if (!res.ok) {
    throw new Error(`John Deere API request failed (${path}): ${res.status} ${await res.text()}`);
  }
  return res.json();
}
