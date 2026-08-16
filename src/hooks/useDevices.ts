import { useCallback } from 'react';
import { useFarmData } from './useFarmData';
import { useDataStore } from '../store/dataStore';
import { useAppStore } from '../store/appStore';
import { getPairedDevice, setPairedDevice, clearPairedDevice } from '../lib/device';

/**
 * Device registry for Tractor Mode: registering, renaming, assigning and
 * revoking the browsers/tablets set up in a cab. See docs/DEVICES.md for the
 * security model — registration always happens from an already-authenticated
 * session on the device itself, so this is device *management*, not a
 * separate login system.
 */
export function useDevices() {
  const { devices, activeFarmId } = useFarmData();
  const { demoMode } = useAppStore();
  const addDevice = useDataStore((s) => s.addDevice);
  const updateDevice = useDataStore((s) => s.updateDevice);
  const deleteDevice = useDataStore((s) => s.deleteDevice);

  const paired = getPairedDevice();
  const thisDevice = paired ? devices.find((d) => d.id === paired.deviceId) : undefined;

  const registerThisDevice = useCallback(async (name: string, assignedUserId?: string) => {
    if (demoMode) {
      // No backend row to attach to in demo mode — fake a local pairing so
      // the flow is still explorable, without pretending it's a real device.
      setPairedDevice({ deviceId: `demo-${Date.now()}`, farmId: activeFarmId, name });
      return;
    }
    const device = await addDevice(activeFarmId, { name, assignedUserId, lastActiveAt: new Date().toISOString() });
    setPairedDevice({ deviceId: device.id, farmId: activeFarmId, name: device.name });
  }, [activeFarmId, addDevice, demoMode]);

  const forgetThisDevice = useCallback(() => {
    clearPairedDevice();
  }, []);

  const renameDevice = useCallback((id: string, name: string) => updateDevice(id, { name }), [updateDevice]);
  const revokeDevice = useCallback((id: string) => updateDevice(id, { status: 'revoked' }), [updateDevice]);
  const reactivateDevice = useCallback((id: string) => updateDevice(id, { status: 'active' }), [updateDevice]);
  const assignDevice = useCallback(
    (id: string, assignedUserId: string | undefined) => updateDevice(id, { assignedUserId }),
    [updateDevice],
  );
  const removeDevice = useCallback((id: string) => deleteDevice(id), [deleteDevice]);

  return {
    devices, paired, thisDevice,
    registerThisDevice, forgetThisDevice,
    renameDevice, revokeDevice, reactivateDevice, assignDevice, removeDevice,
  };
}
