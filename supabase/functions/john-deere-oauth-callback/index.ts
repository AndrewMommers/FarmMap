// This is the redirect_uri John Deere sends the user's browser back to after
// they approve (or deny) access, carrying `?code=&state=` (or `?error=`).
// There is no Supabase session on this request — it's a plain browser
// navigation from John Deere's servers — so this function MUST be deployed
// with JWT verification disabled:
//   supabase functions deploy john-deere-oauth-callback --no-verify-jwt
// Authenticity instead comes from the signed `state` value minted by
// john-deere-oauth-start, and tokens are stored using the service_role key,
// never exposed back to the browser.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { exchangeCodeForTokens, jdFetch, loadJohnDeereConfig } from '../_shared/john-deere.ts';
import { verifyState } from '../_shared/state.ts';

function redirect(url: string): Response {
  return new Response(null, { status: 302, headers: { Location: url } });
}

Deno.serve(async (req) => {
  let cfg;
  try {
    cfg = loadJohnDeereConfig();
  } catch (err) {
    // Can't build a redirect URL without config — fail plainly.
    return new Response(err instanceof Error ? err.message : 'Server misconfigured', { status: 500 });
  }

  const fail = (message: string) =>
    redirect(`${cfg.appBaseUrl}/settings?integration=john_deere&status=error&message=${encodeURIComponent(message)}`);

  const url = new URL(req.url);
  const errorParam = url.searchParams.get('error');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (errorParam) return fail(errorParam);
  if (!code || !state) return fail('Missing code or state from John Deere');

  const stateSecret = Deno.env.get('STATE_SIGNING_SECRET');
  if (!stateSecret) return fail('Server misconfigured: STATE_SIGNING_SECRET not set');

  const farmId = await verifyState(stateSecret, 'john_deere', state);
  if (!farmId) return fail('Invalid or expired connection request — please try again');

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const connectionId = `${farmId}:john_deere`;

  try {
    const tokens = await exchangeCodeForTokens(cfg, code);

    // Look up the connected organisation for display purposes only.
    // TODO: confirm this endpoint/response shape against your JD Developer
    // Portal sandbox — an account can belong to multiple organisations; this
    // scaffold links the first one returned, which is fine for a single-org
    // farmer but not for a contractor/agronomist working across several.
    let orgId: string | undefined;
    let orgName: string | undefined;
    try {
      const orgs = await jdFetch<{ values?: { id: string; name: string }[] }>(cfg, tokens.access_token, '/organizations');
      const first = orgs.values?.[0];
      orgId = first?.id;
      orgName = first?.name;
    } catch (err) {
      console.error('Could not fetch John Deere organisation list:', err);
    }

    const { error: connErr } = await admin.from('integration_connections').upsert({
      id: connectionId,
      farm_id: farmId,
      provider: 'john_deere',
      status: 'connected',
      external_org_id: orgId ?? null,
      external_org_name: orgName ?? null,
      scopes: tokens.scope ? tokens.scope.split(' ') : null,
      connected_at: new Date().toISOString(),
      last_error: null,
    });
    if (connErr) throw connErr;

    const { error: tokErr } = await admin.from('integration_tokens').upsert({
      connection_id: connectionId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (tokErr) throw tokErr;

    return redirect(`${cfg.appBaseUrl}/settings?integration=john_deere&status=connected`);
  } catch (err) {
    console.error('John Deere OAuth callback failed:', err);
    await admin.from('integration_connections').upsert({
      id: connectionId,
      farm_id: farmId,
      provider: 'john_deere',
      status: 'error',
      last_error: err instanceof Error ? err.message : 'Unknown error',
    });
    return fail(err instanceof Error ? err.message : 'Unknown error connecting to John Deere');
  }
});
