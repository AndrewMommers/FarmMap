import { supabase } from './supabase';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';

/**
 * Best-effort client error capture, feeding the Staff Portal's "Recent
 * Errors" section (src/pages/staff/StaffPortalPage.tsx) so staff can see
 * what actually broke for a customer instead of relying on their
 * description. Must never itself throw — a logging failure shouldn't
 * compound whatever already went wrong.
 */
export function logClientError(error: unknown, extra?: Record<string, unknown>): void {
  try {
    const { demoMode, activeFarmId } = useAppStore.getState();
    if (demoMode) return; // no real session/farm to attribute it to

    const user = useAuthStore.getState().user;
    if (!user) return; // client_error_log_insert requires auth.uid()

    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    supabase.from('client_error_log').insert({
      farm_id: activeFarmId || null,
      user_id: user.id,
      user_email: user.email,
      message: extra ? `${message} ${JSON.stringify(extra)}` : message,
      stack,
      path: window.location.pathname,
      user_agent: navigator.userAgent,
    }).then(({ error: dbErr }) => {
      if (dbErr) console.error('[errorLogging] failed to log client error:', dbErr.message);
    });
  } catch {
    // Logging must never itself throw.
  }
}

/** Call once at app startup — catches errors outside React's render tree
 *  (event handlers, async code) that ErrorBoundary explicitly can't. */
export function initGlobalErrorLogging(): void {
  window.addEventListener('error', (e) => logClientError(e.error ?? e.message));
  window.addEventListener('unhandledrejection', (e) => logClientError(e.reason));
}
