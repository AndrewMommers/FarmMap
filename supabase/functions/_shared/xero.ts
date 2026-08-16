// Shared Xero Accounting API config + helpers for Edge Functions.
//
// Unlike John Deere's per-application Okta URLs, Xero's OAuth2 endpoints are
// fixed and globally documented (https://developer.xero.com/documentation/guides/oauth2/auth-flow/),
// so sensible defaults are baked in below. Only the Client ID/Secret (issued
// per app at https://developer.xero.com/app/manage) and your redirect URI
// are truly required. Everything is still overridable via secrets in case
// Xero changes something or you're testing against a different environment.
//
// Set secrets with:
//   supabase secrets set \
//     XERO_CLIENT_ID=... \
//     XERO_CLIENT_SECRET=... \
//     XERO_REDIRECT_URI=... \
//     STATE_SIGNING_SECRET=$(openssl rand -hex 32)   # shared with John Deere, fine to reuse \
//     APP_BASE_URL=https://yourapp.example
//
// See docs/integrations/xero.md for the full setup walkthrough.

export interface XeroConfig {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  connectionsUrl: string;
  apiBaseUrl: string;
  redirectUri: string;
  scopes: string;
  appBaseUrl: string;
}

export function loadXeroConfig(): XeroConfig {
  const env = Deno.env;
  const required = (key: string) => {
    const v = env.get(key);
    if (!v) throw new Error(`Missing required secret: ${key}. See docs/integrations/xero.md.`);
    return v;
  };
  return {
    clientId: required('XERO_CLIENT_ID'),
    clientSecret: required('XERO_CLIENT_SECRET'),
    redirectUri: required('XERO_REDIRECT_URI'),
    authUrl: env.get('XERO_AUTH_URL') ?? 'https://login.xero.com/identity/connect/authorize',
    tokenUrl: env.get('XERO_TOKEN_URL') ?? 'https://identity.xero.com/connect/token',
    connectionsUrl: env.get('XERO_CONNECTIONS_URL') ?? 'https://api.xero.com/connections',
    apiBaseUrl: env.get('XERO_API_BASE_URL') ?? 'https://api.xero.com/api.xro/2.0',
    scopes: env.get('XERO_SCOPES') ?? 'accounting.transactions accounting.contacts.read offline_access openid profile email',
    appBaseUrl: required('APP_BASE_URL'),
  };
}

export interface XeroTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number; // seconds
  token_type: string;
  scope?: string;
}

async function requestToken(cfg: XeroConfig, params: Record<string, string>): Promise<XeroTokenResponse> {
  const res = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${cfg.clientId}:${cfg.clientSecret}`)}`,
    },
    body: new URLSearchParams(params),
  });
  if (!res.ok) throw new Error(`Xero token request failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export function exchangeCodeForTokens(cfg: XeroConfig, code: string): Promise<XeroTokenResponse> {
  return requestToken(cfg, { grant_type: 'authorization_code', code, redirect_uri: cfg.redirectUri });
}

export function refreshAccessToken(cfg: XeroConfig, refreshToken: string): Promise<XeroTokenResponse> {
  return requestToken(cfg, { grant_type: 'refresh_token', refresh_token: refreshToken });
}

export interface XeroTenant {
  tenantId: string;
  tenantName: string;
  tenantType: string;
}

/** A Xero user can be connected to multiple orgs ("tenants") — list them. */
export async function listTenants(cfg: XeroConfig, accessToken: string): Promise<XeroTenant[]> {
  const res = await fetch(cfg.connectionsUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Xero connections request failed: ${res.status} ${await res.text()}`);
  return res.json();
}

/**
 * Authenticated request against the Xero Accounting API. Every request
 * (except /connections) needs the `Xero-tenant-id` header identifying which
 * organisation to operate on.
 */
export async function xeroFetch<T = unknown>(
  cfg: XeroConfig,
  accessToken: string,
  tenantId: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${cfg.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Xero-tenant-id': tenantId,
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) throw new Error(`Xero API request failed (${path}): ${res.status} ${await res.text()}`);
  return res.json();
}
