import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useTractorStore } from '../store/tractorStore';
import { useFarmData } from './useFarmData';
import { useDataStore } from '../store/dataStore';
import { useAppStore } from '../store/appStore';
import { useDevices } from './useDevices';
import { findContainingPaddock, distanceMeters } from '../lib/geo';
import type { Paddock } from '../types';

const MIN_UPDATE_INTERVAL_MS = 15_000;
const MIN_MOVE_METERS = 15;
const MAX_ACCEPTABLE_ACCURACY_M = 100;

export type GpsStatus = 'idle' | 'locating' | 'active' | 'denied' | 'unsupported' | 'error';

/**
 * Foreground-only GPS tracking: only watches position while Tractor Mode is
 * open on a registered device (see docs/GEOFENCING.md) — never in the
 * background, never on an unregistered browser. Writes to `devices.lastLocation`
 * are throttled (time + distance) so we're not hammering the DB on every GPS
 * tick, and geofence enter/exit against paddock boundaries only fires off the
 * same throttled cadence.
 *
 * Demo mode has no real `devices` row behind its locally-faked pairing (see
 * useDevices.registerThisDevice), so there's nothing to persist to — the
 * live marker/status/paddock chip and toasts still work, but location and
 * geofence events aren't written anywhere.
 */
export function useDeviceLocationTracking() {
  const tractorMode = useTractorStore((s) => s.tractorMode);
  const { activeFarmId, paddocks } = useFarmData();
  const demoMode = useAppStore((s) => s.demoMode);
  const { paired, thisDevice } = useDevices();
  const updateDevice = useDataStore((s) => s.updateDevice);
  const addGeofenceEvent = useDataStore((s) => s.addGeofenceEvent);

  const [status, setStatus] = useState<GpsStatus>('idle');
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [currentPaddock, setCurrentPaddock] = useState<Paddock | undefined>(undefined);

  const lastWriteRef = useRef<{ at: number; pos: [number, number] } | null>(null);
  const currentPaddockIdRef = useRef<string | undefined>(undefined);
  const baselineSetRef = useRef(false);

  useEffect(() => {
    // Reset per-session tracking state whenever this effect (re)starts.
    lastWriteRef.current = null;
    currentPaddockIdRef.current = undefined;
    baselineSetRef.current = false;

    // A registered device is required (real row in normal mode, local-only
    // pairing marker in demo mode) — not just "Tractor Mode is open".
    if (!tractorMode || !paired) { setStatus('idle'); return; }
    if (!('geolocation' in navigator)) { setStatus('unsupported'); return; }

    setStatus('locating');
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const point: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setStatus('active');
        setLocation(point);
        setAccuracy(pos.coords.accuracy);

        // Ignore low-quality fixes entirely rather than let them pollute the
        // throttle window or trigger a false geofence crossing.
        if (pos.coords.accuracy != null && pos.coords.accuracy > MAX_ACCEPTABLE_ACCURACY_M) return;

        const now = Date.now();
        const last = lastWriteRef.current;
        const moved = last ? distanceMeters(last.pos, point) : Infinity;
        if (last && now - last.at < MIN_UPDATE_INTERVAL_MS && moved < MIN_MOVE_METERS) return;
        lastWriteRef.current = { at: now, pos: point };

        if (!demoMode && thisDevice) {
          updateDevice(thisDevice.id, { lastLocation: point, lastLocationAt: new Date().toISOString() })
            .catch((err) => console.error('[geo] updateDevice failed:', err));
        }

        const containing = findContainingPaddock(point, paddocks);
        setCurrentPaddock(containing);
        const newId = containing?.id;

        if (!baselineSetRef.current) {
          // First fix of this session just establishes where we are — no
          // enter/exit event for "arriving" at wherever tractor mode was
          // opened, only for actually crossing a boundary after that.
          baselineSetRef.current = true;
          currentPaddockIdRef.current = newId;
          return;
        }

        if (newId === currentPaddockIdRef.current) return;
        const prevId = currentPaddockIdRef.current;
        currentPaddockIdRef.current = newId;

        if (!demoMode && thisDevice) {
          if (prevId) {
            addGeofenceEvent(activeFarmId, { deviceId: thisDevice.id, paddockId: prevId, type: 'exit' })
              .catch((err) => console.error('[geo] addGeofenceEvent (exit) failed:', err));
          }
          if (newId) {
            addGeofenceEvent(activeFarmId, { deviceId: thisDevice.id, paddockId: newId, type: 'enter' })
              .catch((err) => console.error('[geo] addGeofenceEvent (enter) failed:', err));
          }
        }

        if (newId) {
          toast.success(`📍 Entered ${containing?.name ?? 'a paddock'}`);
        } else if (prevId) {
          const left = paddocks.find((p) => p.id === prevId);
          toast(`📍 Left ${left?.name ?? 'paddock'}`);
        }
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tractorMode, paired?.deviceId, demoMode]);

  return { status, location, accuracy, currentPaddock };
}
