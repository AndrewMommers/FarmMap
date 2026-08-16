// Called by the logged-in frontend when a user clicks "Connect" on Xero in
// Settings → Integrations. Verifies the user owns the given farm, then
// returns the Xero authorize URL to redirect the browser to. Deploy WITH JWT
// verification (the default) — this must only run for an authenticated request.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { loadXeroConfig } from '../_shared/xero.ts';
import { signState } from '../_shared/state.ts';
import { corsHeaders, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const cfg = loadXeroConfig();

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

    const { farmId } = await req.json();
    if (!farmId || typeof farmId !== 'string') return json({ error: 'farmId is required' }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: farm, error: farmErr } = await supabase.from('farms').select('id').eq('id', farmId).single();
    if (farmErr || !farm) return json({ error: 'Farm not found or not owned by this user' }, 403);

    const stateSecret = Deno.env.get('STATE_SIGNING_SECRET');
    if (!stateSecret) return json({ error: 'Server misconfigured: STATE_SIGNING_SECRET not set' }, 500);
    const state = await signState(stateSecret, 'xero', farmId);

    const authorizeUrl = new URL(cfg.authUrl);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('client_id', cfg.clientId);
    authorizeUrl.searchParams.set('redirect_uri', cfg.redirectUri);
    authorizeUrl.searchParams.set('scope', cfg.scopes);
    authorizeUrl.searchParams.set('state', state);

    return json({ authorizeUrl: authorizeUrl.toString() });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
