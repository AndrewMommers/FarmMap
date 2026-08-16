import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useDataStore } from '../store/dataStore';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { getPairedDevice, clearPairedDevice } from '../lib/device';

/**
 * Mount ONCE (in AppLayout) — not per-component, to avoid firing the sign-out
 * multiple times. If this browser is a registered device and the farm owner
 * has revoked it from Settings → Devices, forces a sign-out next time the
 * device list refreshes. This is an app-layer control: it stops the app from
 * being usable on that browser, it does not revoke a separate credential
 * (there isn't one) — see docs/DEVICES.md.
 */
export function useDeviceRevocationGuard() {
  const devices = useDataStore((s) => s.devices);
  const demoMode = useAppStore((s) => s.demoMode);
  const signOut = useAuthStore((s) => s.signOut);

  useEffect(() => {
    if (demoMode) return; // no real backend row to check in demo mode
    const paired = getPairedDevice();
    if (!paired) return;
    const device = devices.find((d) => d.id === paired.deviceId);
    if (device && device.status === 'revoked') {
      clearPairedDevice();
      toast.error(`This device ("${paired.name}") was revoked and has been signed out.`);
      signOut();
    }
  }, [devices, demoMode, signOut]);
}
