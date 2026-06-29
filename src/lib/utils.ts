import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Nominatim geocoding (shared, cached) ─────────────────────────────────────

const _geocodeCache = new Map<string, [number, number]>();

/** Clears the geocode cache — call on sign-out to prevent stale location data. */
export function clearGeocodeCache() {
  _geocodeCache.clear();
}

/**
 * Geocodes an Australian address via Nominatim.
 * Results are cached in memory for the lifetime of the page.
 */
export async function geocodeAddress(address: string): Promise<[number, number] | null> {
  const key = address.toLowerCase().trim();
  if (_geocodeCache.has(key)) return _geocodeCache.get(key)!;
  try {
    const url =
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}` +
      `&format=json&limit=1&countrycodes=au`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'FarmMap/1.0' },
    });
    const data: { lat: string; lon: string }[] = await res.json();
    if (data?.[0]) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      _geocodeCache.set(key, coords);
      return coords;
    }
  } catch {
    // ignore
  }
  return null;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat('en-AU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function isOverdue(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  return daysUntil(dateStr) < 0;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    healthy: 'bg-green-100 text-green-800',
    operational: 'bg-green-100 text-green-800',
    growing: 'bg-farm-100 text-farm-800',
    planted: 'bg-blue-100 text-blue-800',
    planned: 'bg-gray-100 text-gray-700',
    fallow: 'bg-yellow-100 text-yellow-800',
    harvested: 'bg-purple-100 text-purple-800',
    ready: 'bg-teal-100 text-teal-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    repair: 'bg-orange-100 text-orange-800',
    sick: 'bg-red-100 text-red-800',
    quarantine: 'bg-orange-100 text-orange-800',
    sold: 'bg-gray-100 text-gray-500',
    deceased: 'bg-gray-200 text-gray-600',
    decommissioned: 'bg-gray-200 text-gray-500',
    failed: 'bg-red-100 text-red-700',
    locked: 'bg-gray-100 text-gray-600',
    todo: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-800',
    done: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-700',
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };
  return map[status] ?? 'bg-gray-100 text-gray-700';
}
