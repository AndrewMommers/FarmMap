/**
 * Utilities for mapping between snake_case Supabase rows and camelCase TypeScript types.
 */

function toCamel(s: string): string {
  return s
    .replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
    // Preserve "AUD" suffix (e.g. amount_aud → amountAUD, not amountAud)
    .replace(/Aud(?=[A-Z]|$)/g, 'AUD');
}

function toSnake(s: string): string {
  // Convert "AUD" to "_aud" first so the general uppercase→"_x" pass doesn't split it
  return s
    .replace(/AUD/g, '_aud')
    .replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/** Convert a DB row (snake_case keys) to a JS object (camelCase keys). */
export function dbToJs<T>(row: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(row)) {
    result[toCamel(key)] = val;
  }
  return result as T;
}

/** Convert a JS object (camelCase keys) to a DB row (snake_case keys).
 *  Strips undefined values so Supabase uses column defaults. */
export function jsToDb(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) result[toSnake(key)] = val;
  }
  return result;
}

/** Map an array of DB rows to typed JS objects. */
export function mapRows<T>(data: Record<string, unknown>[] | null | undefined): T[] {
  return (data ?? []).map((row) => dbToJs<T>(row));
}
