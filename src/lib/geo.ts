/** Geofencing math: point-in-polygon and distance helpers, [lat, lng] throughout. */

/** Standard ray-casting point-in-polygon test. */
export function pointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [py, px] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    const intersects = (yi > py) !== (yj > py) &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** Finds the first paddock whose drawn boundary contains this point, if any. */
export function findContainingPaddock<T extends { polygon?: [number, number][] }>(
  point: [number, number],
  paddocks: T[],
): T | undefined {
  return paddocks.find((p) => p.polygon && p.polygon.length >= 3 && pointInPolygon(point, p.polygon));
}

/** Great-circle distance in metres (haversine). */
export function distanceMeters(a: [number, number], b: [number, number]): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatCoords([lat, lng]: [number, number]): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
