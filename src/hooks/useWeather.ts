import { useState, useEffect } from 'react';
import { geocodeAddress } from '../lib/utils';

export interface LiveWeather {
  tempMax: number;
  tempMin: number;
  rainfall: number;
  windKph: number;
  /** WMO weather interpretation code */
  code: number;
}

/** Maps WMO weather code → short human label */
const WMO_LABELS: Record<number, string> = {
  0: 'Clear',
  1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Freezing fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  56: 'Freezing drizzle', 57: 'Heavy freezing drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  66: 'Freezing rain', 67: 'Heavy freezing rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Showers', 81: 'Showers', 82: 'Heavy showers',
  85: 'Snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
};

export function wmoLabel(code: number): string {
  return WMO_LABELS[code] ?? 'Unknown';
}

/** Broad category for icon selection */
export type WeatherCategory =
  | 'clear' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm';

export function wmoCategory(code: number): WeatherCategory {
  if (code === 0 || code === 1) return 'clear';
  if (code <= 3) return 'cloudy';
  if (code <= 48) return 'fog';
  if (code <= 57) return 'drizzle';
  if (code <= 67 || (code >= 80 && code <= 82)) return 'rain';
  if (code <= 77 || (code >= 85 && code <= 86)) return 'snow';
  return 'storm';
}

// ─── Open-Meteo fetch ─────────────────────────────────────────────────────────

async function fetchWeather(lat: number, lng: number): Promise<LiveWeather | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code` +
      `&timezone=auto&forecast_days=1`;
    const res = await fetch(url);
    const json = await res.json();
    const d = json?.daily;
    if (!d) return null;
    return {
      tempMax:  Math.round(d.temperature_2m_max?.[0] ?? 0),
      tempMin:  Math.round(d.temperature_2m_min?.[0] ?? 0),
      rainfall: Math.round((d.precipitation_sum?.[0] ?? 0) * 10) / 10,
      windKph:  Math.round(d.wind_speed_10m_max?.[0] ?? 0),
      code:     d.weather_code?.[0] ?? 0,
    };
  } catch {
    return null;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetches today's weather for the given address (Nominatim geocoding) or
 * pre-resolved coordinates. Re-fetches when the address changes.
 */
export function useWeather(
  address?: string,
  coordinates?: [number, number],
) {
  const [weather, setWeather] = useState<LiveWeather | null>(null);
  const [loading, setLoading] = useState(false);

  // Stable key so we don't re-fetch on every array reference change
  const lat = coordinates?.[0];
  const lng = coordinates?.[1];

  useEffect(() => {
    if (!address && lat === undefined) {
      // No farm / coords available — clear any previously cached weather
      setWeather(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function run() {
      let resolvedLat = lat;
      let resolvedLng = lng;

      if (resolvedLat === undefined && address) {
        const coords = await geocodeAddress(address);
        if (!coords) { if (!cancelled) setLoading(false); return; }
        [resolvedLat, resolvedLng] = coords;
      }

      const w = await fetchWeather(resolvedLat!, resolvedLng!);
      if (!cancelled) {
        setWeather(w);
        setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, lat, lng]);

  return { weather, loading };
}
