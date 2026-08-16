// Called by the logged-in frontend when a user clicks "Sync Now" (or later,
// by a scheduled job) to pull equipment and field-boundary data from John
// Deere Operations Center into FarmMap's equipment/paddocks tables.
//
// TODO before this does anything useful against real data: the exact
// resource paths and response field names below (`/organizations/{id}/machines`,
// `/organizations/{id}/fields`, engine hours, location shape, etc.) are a
// best-effort mapping from John Deere's public API documentation and MUST be
// confirmed against your own sandbox once you have Developer Portal access —
// John Deere's Equipment/Field Boundary API surface has changed across
// versions. Treat this function as the wiring, not a verified integration.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jdFetch, loadJohnDeereConfig, refreshAccessToken } from '../_shared/john-deere.ts';
import { corsHeaders, json } from '../_shared/cors.ts';

interface JdMachine {
  id: string;
  name?: string;
  model?: { name?: string };
  engineHours?: { value?: number };
  lastKnownLocation?: { lat: number; lon: number };
}

interface JdField {
  id: string;
  name?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  let farmId: string | undefined;
  try {
    const body = await req.json();
    farmId = body.farmId;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!farmId) return json({ error: 'farmId is required' }, 400);

  const connectionId = `${farmId}:john_deere`;
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    const cfg = loadJohnDeereConfig();

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

    // Confirm the caller actually owns this farm before touching its data.
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: farm, error: farmErr } = await userClient.from('farms').select('id').eq('id', farmId).single();
    if (farmErr || !farm) return json({ error: 'Farm not found or not owned by this user' }, 403);

    const { data: connection, error: connErr } = await admin
      .from('integration_connections').select('*').eq('id', connectionId).single();
    if (connErr || !connection) return json({ error: 'John Deere is not connected for this farm' }, 404);

    const { data: tokenRow, error: tokErr } = await admin
      .from('integration_tokens').select('*').eq('connection_id', connectionId).single();
    if (tokErr || !tokenRow) return json({ error: 'No stored credentials for this connection — reconnect required' }, 404);

    // Refresh the access token if it's expired or about to expire.
    let accessToken = tokenRow.access_token as string;
    const expiresAtMs = tokenRow.expires_at ? new Date(tokenRow.expires_at as string).getTime() : 0;
    if (Date.now() > expiresAtMs - 60_000) {
      if (!tokenRow.refresh_token) throw new Error('Access token expired and no refresh token is stored — please reconnect');
      const refreshed = await refreshAccessToken(cfg, tokenRow.refresh_token as string);
      accessToken = refreshed.access_token;
      await admin.from('integration_tokens').update({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token ?? tokenRow.refresh_token,
        expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('connection_id', connectionId);
    }

    const orgId = connection.external_org_id as string | null;
    if (!orgId) throw new Error('No John Deere organisation linked to this connection — try reconnecting');

    // ── Machines → Equipment ────────────────────────────────────────────────
    let machinesSynced = 0;
    try {
      const machines = await jdFetch<{ values?: JdMachine[] }>(cfg, accessToken, `/organizations/${orgId}/machines`);
      for (const m of machines.values ?? []) {
        const { error } = await admin.from('equipment').upsert({
          id: `jd-${m.id}`,
          farm_id: farmId,
          name: m.name ?? `John Deere Machine ${m.id}`,
          category: 'tractor',
          make: 'John Deere',
          model: m.model?.name ?? '',
          status: 'operational',
          hours_or_km: m.engineHours?.value ?? null,
          external_provider: 'john_deere',
          external_id: m.id,
          engine_hours_synced: m.engineHours?.value ?? null,
          last_telemetry_at: new Date().toISOString(),
          last_location: m.lastKnownLocation ? [m.lastKnownLocation.lat, m.lastKnownLocation.lon] : null,
        }, { onConflict: 'id' });
        if (!error) machinesSynced++;
      }
    } catch (err) {
      console.error('John Deere machine sync failed:', err);
    }

    // ── Field boundaries → Paddocks ─────────────────────────────────────────
    // Deliberately does NOT auto-create new paddocks from John Deere fields —
    // that would risk duplicating a farmer's existing hand-drawn paddocks.
    // This only updates paddocks a user has already linked to a boundary ID
    // (that linking UI is a follow-up piece of work, not built yet).
    let boundariesSynced = 0;
    try {
      const fields = await jdFetch<{ values?: JdField[] }>(cfg, accessToken, `/organizations/${orgId}/fields`);
      for (const f of fields.values ?? []) {
        const { error, count } = await admin.from('paddocks')
          .update({ external_provider: 'john_deere' })
          .eq('farm_id', farmId)
          .eq('external_boundary_id', f.id)
          .select('id', { count: 'exact', head: true });
        if (!error && count) boundariesSynced += count;
      }
    } catch (err) {
      console.error('John Deere field sync failed:', err);
    }

    await admin.from('integration_connections').update({
      status: 'connected',
      last_sync_at: new Date().toISOString(),
      last_error: null,
    }).eq('id', connectionId);

    return json({ ok: true, machinesSynced, boundariesSynced });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown sync error';
    await admin.from('integration_connections').update({ status: 'error', last_error: message }).eq('id', connectionId);
    return json({ error: message }, 500);
  }
});
