# FarmMap

A map-first farm management app for Australian farms — paddocks, livestock, crops, equipment, finance, inventory, tasks, weather and compliance in one place, plus a Tractor Mode built for use from the cab.

Public marketing site lives at `/`; the app itself is behind sign-in (or **Try the Demo**, which runs entirely on local sample data with no backend writes).

## Feature overview

- **Farm records** — paddock mapping (Leaflet), livestock (mobs and individual animals), crops and spray records, equipment and maintenance logs, finance (transactions, budgets, GST), inventory, tasks, weather.
- **Compliance & reporting** — chemical use register generated from spray records, withholding-period tracking, one-click PDF/CSV exports.
- **Tractor Mode** — a big-button, glove-friendly screen for the cab: live GPS position, geofence alerts when entering/leaving a mapped paddock, and a team directory with tap-to-call.
- **Devices & profile** — register a tablet or phone to Tractor Mode, revoke access centrally, per-user profile and roles.
- **Integrations** — John Deere Operations Center (equipment telemetry, GPS, field boundaries), Xero (accounting sync), Zepto (real-time AU payments).

See [`docs/versions/`](docs/versions/README.md) for a phase-by-phase history of how this was all built.

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS (class-based dark mode)
- Zustand for state, with a `persist`-backed demo mode
- Supabase (Postgres, Auth, Realtime, Edge Functions) as the backend
- `react-leaflet` / Leaflet for mapping
- PWA-enabled (`vite-plugin-pwa`)

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
npm run dev
```

The dev server binds to all network interfaces (`server.host: true` in `vite.config.ts`), so it's also reachable from other devices on your LAN at `http://<your-machine-ip>:5173`.

To run against a real backend, apply `supabase/schema.sql` to your Supabase project and deploy the functions in `supabase/functions/`. Without that, **Try the Demo** on the landing page works out of the box with no configuration.

### Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check (`tsc -b`) then build for production
- `npm run lint` — run Oxlint
- `npm run preview` — preview the production build locally

## Project structure

```text
src/
  pages/        # Route-level pages (Dashboard, Paddocks, Livestock, ..., LandingPage)
  components/    # Layout, map, and UI components
  hooks/         # Data + device hooks (useDevices, useDeviceLocationTracking, ...)
  store/         # Zustand stores (appStore, dataStore)
  lib/           # Supabase client, db mapping helpers, geo utilities
  types/         # Shared TypeScript types
supabase/
  schema.sql     # Postgres schema + RLS policies
  functions/     # Edge Functions (OAuth flows, sync, disconnect per integration)
docs/
  DEVICES.md, GEOFENCING.md, integrations/, guides/   # Developer & end-user docs
  versions/      # Chronological project history
```

## Security notes

- Row-level security everywhere, scoped to `farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())`.
- `integration_tokens` (OAuth tokens for John Deere/Xero/Zepto) has **no RLS policies** — default-deny for all client roles; only Edge Functions using the `service_role` key can read or write them. Tokens never reach the browser.
- Device "revocation" is an app-layer forced sign-out, not a hard credential revoke — see [`docs/DEVICES.md`](docs/DEVICES.md) for the honest details.

## Docs

- [`docs/FEATURES.md`](docs/FEATURES.md) — what's complete vs. not, across the whole app
- [`docs/versions/`](docs/versions/README.md) — full project history, one file per phase of work
- [`docs/TODO.md`](docs/TODO.md) — outstanding-work punch list, tracked on [GitHub Issues](https://github.com/AndrewMommers/FarmMap/issues)
- [`docs/DEVICES.md`](docs/DEVICES.md), [`docs/GEOFENCING.md`](docs/GEOFENCING.md) — how device pairing and geofencing work
- [`docs/integrations/`](docs/integrations/) — John Deere, Xero, Zepto integration details
- [`docs/guides/`](docs/guides/) — end-user setup guides
