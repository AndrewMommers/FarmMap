/**
 * Browser/OS push notifications via the Web Notifications API, delivered
 * through the PWA's service worker when available so they still show up
 * if the FarmMap tab is open but not focused. This does NOT work if the
 * browser/tab is fully closed — true background push needs a server-side
 * push subscription (VAPID keys + an Edge Function to send them), which
 * isn't built. See docs/FEATURES.md.
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

export async function showBrowserNotification(title: string, body?: string, tag?: string): Promise<void> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  // Note: vite.config.ts's PWA manifest references pwa-192x192.png/pwa-512x512.png
  // which don't actually exist in public/ (see docs/FEATURES.md) — favicon.svg is
  // the only icon asset that's real today.
  const options: NotificationOptions = { body, tag, icon: '/favicon.svg' };

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
      return;
    } catch {
      // Fall through to the plain Notification constructor below.
    }
  }
  new Notification(title, options);
}
