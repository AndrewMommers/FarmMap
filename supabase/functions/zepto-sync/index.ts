// Called by the logged-in frontend ("Sync Now") to pull recent Zepto
// payments into FarmMap's `transactions` table. See _shared/zepto.ts for the
// confidence warning — the /payments path and response fields below are a
// best-effort guess at a typical payments-API shape, not verified against
// Zepto's real API.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { loadZeptoConfig, zeptoFetch } from '../_shared/zepto.ts';
import { corsHeaders, json } from '../_shared/cors.ts';

interface ZeptoPayment {
  id: string;
  status?: 'pending' | 'completed' | 'failed' | string;
  direction?: 'in' | 'out' | string; // 'in' = money received, 'out' = money paid out
  amount: number; // assumed AUD cents or dollars — TODO: confirm the unit
  description?: string;
  counterparty?: { name?: string };
  createdAt: string;
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

  const connectionId = `${farmId}:zepto`;
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    const cfg = loadZeptoConfig();

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: farm, error: farmErr } = await userClient.from('farms').select('id').eq('id', farmId).single();
    if (farmErr || !farm) return json({ error: 'Farm not found or not owned by this user' }, 403);

    const { data: tokenRow, error: tokErr } = await admin
      .from('integration_tokens').select('*').eq('connection_id', connectionId).single();
    if (tokErr || !tokenRow) return json({ error: 'Zepto is not connected for this farm' }, 404);

    const apiKey = tokenRow.access_token as string;
    let transactionsSynced = 0;
    const result = await zeptoFetch<{ payments?: ZeptoPayment[] }>(cfg, apiKey, cfg.paymentsPath);

    for (const p of result.payments ?? []) {
      const { error } = await admin.from('transactions').upsert({
        id: `zepto-${p.id}`,
        farm_id: farmId,
        date: (p.createdAt ?? new Date().toISOString()).slice(0, 10),
        type: p.direction === 'out' ? 'expense' : 'income',
        category: p.direction === 'out' ? 'other_expense' : 'other_income',
        description: p.description ?? 'Zepto payment',
        amount_aud: Math.abs(p.amount),
        gst_included: false, // TODO: Zepto payments are raw bank transfers — GST treatment depends on what the payment was for, not knowable from the payment itself
        supplier: p.counterparty?.name ?? null,
        external_provider: 'zepto',
        external_id: p.id,
        payment_status: p.status === 'completed' || p.status === 'failed' ? p.status : 'pending',
      }, { onConflict: 'id' });
      if (!error) transactionsSynced++;
    }

    await admin.from('integration_connections').update({
      status: 'connected',
      last_sync_at: new Date().toISOString(),
      last_error: null,
    }).eq('id', connectionId);

    return json({ ok: true, transactionsSynced });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown sync error';
    await admin.from('integration_connections').update({ status: 'error', last_error: message }).eq('id', connectionId);
    return json({ error: message }, 500);
  }
});
