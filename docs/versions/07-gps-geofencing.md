# 07 — GPS tracking & geofencing

**Request:** "Lets look into the GPS location, and lets make it work and stated as well. Lets also implement GEO-Fencing."

## What changed

- **`useDeviceLocationTracking.ts`** — foreground-only GPS tracking, gated on `tractorMode` being on and a registered device. Uses `navigator.geolocation.watchPosition`, throttled to whichever is later of 15 seconds or 15 metres of movement, and filters out fixes with accuracy worse than 100m. The first fix in a session only establishes a baseline — it never fires a false "entered paddock" event.
- **`src/lib/geo.ts`** — `pointInPolygon` (ray-casting), `findContainingPaddock`, `distanceMeters` (haversine), `formatCoords`. Geofencing reuses the paddock boundaries that already exist rather than adding a separate zone-drawing tool.
- **`geofence_events`** table added to `supabase/schema.sql` (`device_id`, `paddock_id`, `type`, `occurred_at`), with the standard farm-owner RLS policy.
- **Map**: `FarmMapLeaflet.tsx` gained an optional `liveMarker` prop — a pulsing "you are here" dot plus an accuracy circle. Deliberately does not recenter the map on GPS updates, so it doesn't fight the user's panning.
- **Tractor Mode overlay** rebuilt with Overview/Map/Team tabs, a GPS status pill (idle/locating/active/denied/unsupported/error), and a "Currently in X" / "Outside any mapped paddock" chip.
- Documented in `docs/GEOFENCING.md`.

## Key files

- `src/hooks/useDeviceLocationTracking.ts`
- `src/lib/geo.ts`
- `src/components/map/FarmMapLeaflet.tsx`
- `src/components/layout/TractorModeOverlay.tsx`
- `supabase/schema.sql`
- `docs/GEOFENCING.md`
