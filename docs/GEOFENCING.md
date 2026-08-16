# GPS tracking & geofencing

Status: **built and working** — this one isn't a scaffold waiting on external
credentials like the John Deere/Xero/Zepto integrations. It runs entirely in
the browser using the standard Geolocation API, no third-party service.

## What it does

- While **Tractor Mode is open on a registered device**, the browser's GPS
  is watched (`navigator.geolocation.watchPosition`) and the device's
  position is periodically written to `devices.last_location` /
  `last_location_at`.
- The **Map** tab in Tractor Mode shows a live pulsing "you are here"
  marker (with an accuracy-radius circle), plus a chip stating which
  paddock you're currently in (or "outside any mapped paddock").
- A **GPS status pill** in the Tractor Mode header always states the
  current state plainly: `GPS off` / `Locating…` / `GPS active` /
  `Location blocked` / `GPS unsupported` / `GPS error` — this is the
  "state it" part: the feature never silently fails, it tells you why.
- **Geofencing** reuses each paddock's drawn boundary (`Paddock.polygon` —
  the same polygons drawn on the Paddocks page) rather than a separate
  zone-drawing tool. Crossing a boundary:
  - fires a toast ("📍 Entered North Flat" / "📍 Left North Flat")
  - logs a row to `geofence_events` (device, paddock, enter/exit, when)
  - shows up in Settings → Devices → **Recent Geofence Activity**, and as
    a one-line "In North Flat · 2 min ago" status under each device in that
    same list.

## Why it's foreground-only, and why that's deliberate

This does **not** track in the background, and does **not** run just
because a device is registered — only while Tractor Mode is actually open
on that device (`useDeviceLocationTracking`, gated on the same
`tractorMode` flag as the overlay itself, called from
`TractorModeOverlay.tsx`). Closing Tractor Mode stops the GPS watch
(`navigator.geolocation.clearWatch` in the effect cleanup).

Two reasons:
1. **Battery and permission reality.** Browsers already require an
   explicit, per-site permission prompt for geolocation — there's no way to
   get continuous background tracking from a web app without that consent
   gate anyway (and mobile browsers aggressively suspend background tabs).
2. **Consent should track how it's presented.** "This screen shows your
   live position and logs which paddock you're in" (Tractor Mode, GPS
   status pill always visible) is an honest framing for a farm-management
   tool. Silent, continuous background tracking is a materially different
   and more invasive thing that wasn't asked for here.

If you want tracking that continues after Tractor Mode is closed, that's a
different feature (likely needing a native app or a background sync
worker) — not something this implementation does.

## Throttling

Raw GPS callbacks can fire every few seconds. Writing to Supabase and
recomputing geofence membership on every single one would be wasteful and
would make minor GPS jitter near a boundary look like rapid enter/exit
flapping. `useDeviceLocationTracking` throttles both to whichever is later
of: **15 seconds** since the last write, or **15 metres** of movement. Fixes
with `accuracy` worse than 100m are ignored outright rather than risk a
bogus boundary crossing. The very first fix in a session only establishes a
baseline — it never fires an "entered" event just for opening Tractor Mode
inside a paddock.

## What this deliberately does NOT do

- No historical breadcrumb trail of every position — only paddock
  enter/exit transitions are persisted. Storing (and later needing to
  purge/export) a continuous location history is a real privacy
  commitment that wasn't asked for; the enter/exit log is the useful
  signal without that burden.
- No geofence zones beyond paddock boundaries (no separate "restricted
  area" or whole-of-property perimeter tool). Paddocks already are the
  farm's zones — a second drawing tool would be redundant.
- No cross-farm visibility — `geofence_events` and `devices` carry the same
  farm-owner-only RLS policy as every other table.
- No alerting beyond an in-app toast + the activity log (no SMS/push/email
  when a device crosses a boundary). Worth adding later if it turns out to
  matter, but it's a notification-delivery feature, not a geofencing one.
