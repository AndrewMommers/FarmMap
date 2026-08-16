// This is the redirect_uri Xero sends the user's browser back to after they
// approve (or deny) access, carrying `?code=&state=` (or `?error=`). There is
// no Supabase session on this request, so this function MUST be deployed
// with JWT verification disabled:
//   supabase functions deploy xero-oauth-callback --no-verify-jwt
// Authenticity comes from the signed `state` value minted by
// xero-oauth-start; tokens are stored using the service_role key only.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { exchangeCodeForTokens, listTenants, loadXeroConfig } from '../_shared/xero.ts';
import { verifyState } from '../_shared/state.ts';

function redirect(url: string): Response {
  return new Response(null, { status: 302, headers: { Location: url } });
}

Deno.serve(async (req) => {
  let cfg;
  try {
    cfg = loadXeroConfig();
  } catch (err) {
    return new Response(err instanceof Error ? err.message : 'Server misconfigured', { status: 500 });
  }

  const fail = (message: string) =>
    redirect(`${cfg.appBaseUrl}/settings?integration=xero&status=error&message=${encodeURIComponent(message)}`);

  const url = new URL(req.url);
  const errorParam = url.searchParams.get('error');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (errorParam) return fail(errorParam);
  if (!code || !state) return fail('Missing code or state from Xero');

  const stateSecret = Deno.env.get('STATE_SIGNING_SECRET');
  if (!stateSecret) return fail('Server misconfigured: STATE_SIGNING_SECRET not set');

  const farmId = await verifyState(stateSecret, 'xero', state);
  if (!farmId) return fail('Invalid or expired connection request — please try again');

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const connectionId = `${farmId}:xero`;

  try {
    const tokens = await exchangeCodeForTokens(cfg, code);

    // A Xero login can be connected to multiple organisations ("tenants").
    // This scaffold links the first one — fine for a farm with a single set
    // of books, not for a bookkeeper managing several. Picking a specific
    // tenant is a follow-up UI, not built here.
    const tenants = await listTenants(cfg, tokens.access_token);
    const tenant = tenants[0];
    if (!tenant) throw new Error('No Xero organisation is connected to this account');

    const { error: connErr } = await admin.from('integration_connections').upsert({
      id: connectionId,
      farm_id: farmId,
      provider: 'xero',
      status: 'connected',
      external_org_id: tenant.tenantId,
      external_org_name: tenant.tenantName,
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

    return redirect(`${cfg.appBaseUrl}/settings?integration=xero&status=connected`);
  } catch (err) {
    console.error('Xero OAuth callback failed:', err);
    await admin.from('integration_connections').upsert({
      id: connectionId,
      farm_id: farmId,
      provider: 'xero',
      status: 'error',
      last_error: err instanceof Error ? err.message : 'Unknown error',
    });
    return fail(err instanceof Error ? err.message : 'Unknown error connecting to Xero');
  }
});
