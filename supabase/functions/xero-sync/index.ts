// Called by the logged-in frontend ("Sync Now") to pull recent Xero bank
// transactions into FarmMap's `transactions` table for reporting. This is
// deliberately a one-directional pull (Xero → FarmMap), not a full
// bidirectional accounting sync — pushing FarmMap transactions back into
// Xero, and reconciling edits made on both sides, is a much bigger design
// problem (conflict resolution, chart-of-accounts mapping) that hasn't been
// asked for and isn't built here.
//
// TODO before relying on this: Xero's `BankTransactions` endpoint returns
// amounts in the organisation's base currency (assumed AUD here — verify for
// your org), dates historically use a `/Date(ms+tz)/` wrapper in some Xero
// API responses rather than plain ISO8601 (handled defensively below, but
// confirm against what your sandbox actually returns), and there is no
// direct mapping from Xero's chart-of-accounts `AccountCode` to FarmMap's
// fixed `TransactionCategory` enum — everything lands in
// other_income/other_expense until you add that mapping.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { loadXeroConfig, refreshAccessToken, xeroFetch } from '../_shared/xero.ts';
import { corsHeaders, json } from '../_shared/cors.ts';

interface XeroBankTransaction {
  BankTransactionID: string;
  Type: 'RECEIVE' | 'SPEND' | string;
  Contact?: { Name?: string };
  Date: string;
  Reference?: string;
  Total: number;
  LineItems?: { Description?: string }[];
}

/** Xero's older endpoints sometimes wrap dates as /Date(1700000000000+0000)/. */
function parseXeroDate(raw: string): string {
  const match = /\/Date\((\d+)/.exec(raw);
  const date = match ? new Date(Number(match[1])) : new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : date.toISOString().slice(0, 10);
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

  const connectionId = `${farmId}:xero`;
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    const cfg = loadXeroConfig();

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: farm, error: farmErr } = await userClient.from('farms').select('id').eq('id', farmId).single();
    if (farmErr || !farm) return json({ error: 'Farm not found or not owned by this user' }, 403);

    const { data: connection, error: connErr } = await admin
      .from('integration_connections').select('*').eq('id', connectionId).single();
    if (connErr || !connection) return json({ error: 'Xero is not connected for this farm' }, 404);

    const { data: tokenRow, error: tokErr } = await admin
      .from('integration_tokens').select('*').eq('connection_id', connectionId).single();
    if (tokErr || !tokenRow) return json({ error: 'No stored credentials for this connection — reconnect required' }, 404);

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

    const tenantId = connection.external_org_id as string | null;
    if (!tenantId) throw new Error('No Xero organisation linked to this connection — try reconnecting');

    let transactionsSynced = 0;
    const result = await xeroFetch<{ BankTransactions?: XeroBankTransaction[] }>(
      cfg, accessToken, tenantId, '/BankTransactions?order=Date DESC&page=1',
    );
    for (const t of result.BankTransactions ?? []) {
      const { error } = await admin.from('transactions').upsert({
        id: `xero-${t.BankTransactionID}`,
        farm_id: farmId,
        date: parseXeroDate(t.Date),
        type: t.Type === 'RECEIVE' ? 'income' : 'expense',
        category: t.Type === 'RECEIVE' ? 'other_income' : 'other_expense', // TODO: map from AccountCode
        description: t.LineItems?.[0]?.Description ?? t.Reference ?? 'Xero transaction',
        amount_aud: Math.abs(t.Total),
        gst_included: true,
        supplier: t.Contact?.Name ?? null,
        invoice_number: t.Reference ?? null,
        external_provider: 'xero',
        external_id: t.BankTransactionID,
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
