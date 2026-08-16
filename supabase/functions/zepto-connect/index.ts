// Called by the frontend when a user submits their Zepto API key in
// Settings → Integrations. Zepto is modelled as an API-key connection
// (like Stripe), not an OAuth redirect — see _shared/zepto.ts for why, and
// for the confidence warning about how unverified this API shape is.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { loadZeptoConfig, zeptoFetch } from '../_shared/zepto.ts';
import { corsHeaders, json } from '../_shared/cors.ts';

interface ZeptoMerchantInfo {
  id?: string;
  name?: string;
  businessName?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const cfg = loadZeptoConfig();

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

    const { farmId, apiKey } = await req.json();
    if (!farmId || typeof farmId !== 'string') return json({ error: 'farmId is required' }, 400);
    if (!apiKey || typeof apiKey !== 'string') return json({ error: 'apiKey is required' }, 400);

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: farm, error: farmErr } = await userClient.from('farms').select('id').eq('id', farmId).single();
    if (farmErr || !farm) return json({ error: 'Farm not found or not owned by this user' }, 403);

    // Verify the key actually works before storing it. TODO: confirm this
    // endpoint against Zepto's real docs — /merchant is a guess.
    let merchantName: string | undefined;
    try {
      const info = await zeptoFetch<ZeptoMerchantInfo>(cfg, apiKey, cfg.verifyPath);
      merchantName = info.businessName ?? info.name;
    } catch (err) {
      return json({ error: `Could not verify Zepto API key: ${err instanceof Error ? err.message : 'unknown error'}` }, 400);
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const connectionId = `${farmId}:zepto`;

    const { error: connErr } = await admin.from('integration_connections').upsert({
      id: connectionId,
      farm_id: farmId,
      provider: 'zepto',
      status: 'connected',
      external_org_name: merchantName ?? null,
      connected_at: new Date().toISOString(),
      last_error: null,
    });
    if (connErr) throw connErr;

    // Reuses the same token vault table as the OAuth providers — access_token
    // holds the API key here. No refresh_token / expiry for an API key.
    const { error: tokErr } = await admin.from('integration_tokens').upsert({
      connection_id: connectionId,
      access_token: apiKey,
      updated_at: new Date().toISOString(),
    });
    if (tokErr) throw tokErr;

    return json({ ok: true, merchantName });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
