// Called by the frontend's "Disconnect" button. Deletes the stored tokens
// and marks the connection as disconnected. Equipment/paddocks already
// synced from John Deere are left in place (with external_provider still
// set) — disconnecting stops future syncs, it doesn't delete farm records.
//
// TODO: John Deere also supports revoking a token server-side via their
// revocation endpoint so the grant is fully torn down on their end too, not
// just forgotten locally. Worth adding once you're testing against a real
// sandbox and can confirm the revocation endpoint URL for your app.
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
    const connectionId = `${farmId}:john_deere`;

    await admin.from('integration_tokens').delete().eq('connection_id', connectionId);
    const { error } = await admin.from('integration_connections').update({
      status: 'disconnected',
      external_org_id: null,
      external_org_name: null,
      scopes: null,
      last_error: null,
    }).eq('id', connectionId);
    if (error) throw error;

    return json({ ok: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
