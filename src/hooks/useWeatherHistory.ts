import { useState, useEffect } from 'react';
import type { WeatherReading, RainfallSummary } from '../types';
import { geocodeAddress, clearGeocodeCache } from '../lib/utils';

// ─── Module-level response cache ──────────────────────────────────────────────
// Shared across all hook instances so we only fetch once per address per session.

interface CacheEntry {
  readings: WeatherReading[];
  rainfallSummary: RainfallSummary[];
  ts: number;
}
const _cache = new Map<string, CacheEntry>();
const TTL = 30 * 60 * 1000; // 30 minutes

/** Call on sign-out / demo-exit to prevent stale weather for a different farm */
export function clearWeatherCache() {
  _cache.clear();
  clearGeocodeCache();
}

// ─── Open-Meteo fetch ─────────────────────────────────────────────────────────

async function fetchHistory(lat: number, lng: number): Promise<{
  readings: WeatherReading[];
  rainfallSummary: RainfallSummary[];
}> {
  // past_days=92 = ~3 months; forecast_days=1 = include today
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code,et0_fao_evapotranspiration` +
    `&timezone=auto&past_days=92&forecast_days=1`;

  const res = await fetch(url);
  const json = await res.json();
  const d = json?.daily;
  if (!d) throw new Error('No daily data from Open-Meteo');

  // ── Daily readings ─────────────────────────────────────────────────────────
  const readings: WeatherReading[] = (d.time as string[]).map((date: string, i: number) => ({
    date,
    tempMaxC:   Math.round(d.temperature_2m_max?.[i] ?? 0),
    tempMinC:   Math.round(d.temperature_2m_min?.[i] ?? 0),
    rainfallMm: Math.round((d.precipitation_sum?.[i] ?? 0) * 10) / 10,
    windKph:    Math.round(d.wind_speed_10m_max?.[i] ?? 0),
    evapMm:
      d.et0_fao_evapotranspiration?.[i] != null
        ? Math.round(d.et0_fao_evapotranspiration[i] * 10) / 10
        : undefined,
  }));

  // ── Monthly rainfall summary ───────────────────────────────────────────────
  const byMonth: Record<string, number> = {};
  for (const r of readings) {
    const ym = r.date.slice(0, 7); // "YYYY-MM"
    byMonth[ym] = (byMonth[ym] ?? 0) + r.rainfallMm;
  }
  const rainfallSummary: RainfallSummary[] = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, mm]) => ({
      month: new Date(ym + '-15').toLocaleString('en-AU', {
        month: 'short',
        year: '2-digit',
      }),
      rainfallMm:    Math.round(mm * 10) / 10,
      avgRainfallMm: 0, // Long-term averages not available from free Open-Meteo tier
    }));

  return { readings, rainfallSummary };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetches ~3 months of daily weather history from Open-Meteo for the given
 * farm address (geocoded via Nominatim) or pre-resolved coordinates.
 *
 * Results are cached for 30 minutes so all components sharing `useFarmData()`
 * don't trigger duplicate network requests.
 */
export function useWeatherHistory(
  address?: string,
  coordinates?: [number, number],
) {
  const [readings, setReadings] = useState<WeatherReading[]>([]);
  const [rainfallSummary, setRainfallSummary] = useState<RainfallSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const lat = coordinates?.[0];
  const lng = coordinates?.[1];

  useEffect(() => {
    if (!address && lat === undefined) {
      // No farm / coords — clear stale data so demo data doesn’t linger
      setReadings([]);
      setRainfallSummary([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function run() {
      let rLat = lat;
      let rLng = lng;

      if (rLat === undefined && address) {
        const coords = await geocodeAddress(address);
        if (!coords) {
          if (!cancelled) setLoading(false);
          return;
        }
        [rLat, rLng] = coords;
      }

      const cacheKey = `${rLat!.toFixed(2)},${rLng!.toFixed(2)}`;
      const hit = _cache.get(cacheKey);
      if (hit && Date.now() - hit.ts < TTL) {
        if (!cancelled) {
          setReadings(hit.readings);
          setRainfallSummary(hit.rainfallSummary);
          setLoading(false);
        }
        return;
      }

      try {
        const result = await fetchHistory(rLat!, rLng!);
        _cache.set(cacheKey, { ...result, ts: Date.now() });
        if (!cancelled) {
          setReadings(result.readings);
          setRainfallSummary(result.rainfallSummary);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, lat, lng]);

  return { readings, rainfallSummary, loading };
}
