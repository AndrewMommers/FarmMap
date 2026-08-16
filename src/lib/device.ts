/**
 * Local (per-browser) record of which registered `devices` row this browser
 * is. Registration always happens from an already-authenticated session on
 * the device itself — see docs/DEVICES.md for why, and for the honest limits
 * of what "revoking" a device actually does (it's an app-layer sign-out
 * trigger, not a credential that can be hard-revoked, since there isn't a
 * separate device credential).
 */

const KEY = 'farmmap-device';

export interface PairedDevice {
  deviceId: string;
  farmId: string;
  name: string;
}

export function getPairedDevice(): PairedDevice | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.deviceId === 'string') return parsed as PairedDevice;
    return null;
  } catch {
    return null;
  }
}

export function setPairedDevice(pairing: PairedDevice): void {
  localStorage.setItem(KEY, JSON.stringify(pairing));
}

export function clearPairedDevice(): void {
  localStorage.removeItem(KEY);
}
