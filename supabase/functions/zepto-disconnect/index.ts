// Called by the frontend's "Disconnect" button. Deletes the stored API key
// and marks the connection as disconnected. Transactions already synced
// from Zepto are left in place — disconnecting stops future syncs, it
// doesn't delete financial records.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

    const { farmId } = await req.json();
    if (!farmId) return json({ error: 'farmId is required' }, 400);

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: farm, error: farmErr } = await userClient.from('farms').select('id').eq('id', farmId).single();
    if (farmErr || !farm) return json({ error: 'Farm not found or not owned by this user' }, 403);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const connectionId = `${farmId}:zepto`;

    await admin.from('integration_tokens').delete().eq('connection_id', connectionId);
    const { error } = await admin.from('integration_connections').update({
      status: 'disconnected',
      external_org_id: null,
      external_org_name: null,
      last_error: null,
    }).eq('id', connectionId);
    if (error) throw error;

    return json({ ok: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
