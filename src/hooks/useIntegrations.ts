import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/appStore';
import { dbToJs } from '../lib/db';
import type { IntegrationConnection } from '../types';

/**
 * Loads this farm's integration connections (John Deere, Xero, Zepto) and
 * exposes the connect/sync/disconnect actions for each. The Edge Functions
 * this calls hold the actual OAuth tokens / API keys server-side — this hook
 * never sees a credential, only connection status/metadata.
 */
export function useIntegrations() {
  const { activeFarmId, demoMode } = useAppStore();
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (demoMode || !activeFarmId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('integration_connections')
      .select('*')
      .eq('farm_id', activeFarmId);
    if (!error) setConnections((data ?? []).map((row) => dbToJs<IntegrationConnection>(row)));
    setLoading(false);
  }, [activeFarmId, demoMode]);

  useEffect(() => { refresh(); }, [refresh]);

  const johnDeere = connections.find((c) => c.provider === 'john_deere');
  const xero = connections.find((c) => c.provider === 'xero');
  const zepto = connections.find((c) => c.provider === 'zepto');

  // ── John Deere (OAuth redirect) ───────────────────────────────────────────
  const connectJohnDeere = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke<{ authorizeUrl?: string; error?: string }>(
      'john-deere-oauth-start',
      { body: { farmId: activeFarmId } },
    );
    if (error || !data?.authorizeUrl) {
      throw new Error(data?.error ?? error?.message ?? 'Could not start the John Deere connection');
    }
    window.location.href = data.authorizeUrl;
  }, [activeFarmId]);

  const syncJohnDeere = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke<{
      ok?: boolean; error?: string; machinesSynced?: number; boundariesSynced?: number;
    }>('john-deere-sync', { body: { farmId: activeFarmId } });
    if (error || !data?.ok) throw new Error(data?.error ?? error?.message ?? 'Sync failed');
    await refresh();
    return data;
  }, [activeFarmId, refresh]);

  const disconnectJohnDeere = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
      'john-deere-disconnect',
      { body: { farmId: activeFarmId } },
    );
    if (error || !data?.ok) throw new Error(data?.error ?? error?.message ?? 'Disconnect failed');
    await refresh();
  }, [activeFarmId, refresh]);

  // ── Xero (OAuth redirect) ─────────────────────────────────────────────────
  const connectXero = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke<{ authorizeUrl?: string; error?: string }>(
      'xero-oauth-start',
      { body: { farmId: activeFarmId } },
    );
    if (error || !data?.authorizeUrl) {
      throw new Error(data?.error ?? error?.message ?? 'Could not start the Xero connection');
    }
    window.location.href = data.authorizeUrl;
  }, [activeFarmId]);

  const syncXero = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke<{
      ok?: boolean; error?: string; transactionsSynced?: number;
    }>('xero-sync', { body: { farmId: activeFarmId } });
    if (error || !data?.ok) throw new Error(data?.error ?? error?.message ?? 'Sync failed');
    await refresh();
    return data;
  }, [activeFarmId, refresh]);

  const disconnectXero = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
      'xero-disconnect',
      { body: { farmId: activeFarmId } },
    );
    if (error || !data?.ok) throw new Error(data?.error ?? error?.message ?? 'Disconnect failed');
    await refresh();
  }, [activeFarmId, refresh]);

  // ── Zepto (API key, no redirect) ──────────────────────────────────────────
  const connectZepto = useCallback(async (apiKey: string) => {
    const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string; merchantName?: string }>(
      'zepto-connect',
      { body: { farmId: activeFarmId, apiKey } },
    );
    if (error || !data?.ok) throw new Error(data?.error ?? error?.message ?? 'Could not connect to Zepto');
    await refresh();
    return data;
  }, [activeFarmId, refresh]);

  const syncZepto = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke<{
      ok?: boolean; error?: string; transactionsSynced?: number;
    }>('zepto-sync', { body: { farmId: activeFarmId } });
    if (error || !data?.ok) throw new Error(data?.error ?? error?.message ?? 'Sync failed');
    await refresh();
    return data;
  }, [activeFarmId, refresh]);

  const disconnectZepto = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
      'zepto-disconnect',
      { body: { farmId: activeFarmId } },
    );
    if (error || !data?.ok) throw new Error(data?.error ?? error?.message ?? 'Disconnect failed');
    await refresh();
  }, [activeFarmId, refresh]);

  return {
    connections, loading, refresh,
    johnDeere, connectJohnDeere, syncJohnDeere, disconnectJohnDeere,
    xero, connectXero, syncXero, disconnectXero,
    zepto, connectZepto, syncZepto, disconnectZepto,
  };
}
