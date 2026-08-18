# 01 — Baseline app

The starting point before this change log begins tracking work in detail. A React + TypeScript + Vite single-page app for running an Australian farm, backed by Supabase (Postgres, Auth, Realtime).

## What existed

- **Core records**: paddocks (with map boundaries), livestock (mobs and individual animals), crops and spray records, equipment and maintenance logs, finance (transactions and budgets), inventory, tasks, weather.
- **Compliance & reporting**: chemical use register, exportable reports.
- **Map**: `react-leaflet`/Leaflet-based paddock map (`FarmMapLeaflet.tsx`).
- **State**: Zustand stores (`appStore`, `dataStore`) with a `persist` middleware and a demo mode that loads local mock data with no backend writes.
- **Data layer**: Supabase Postgres with row-level security scoped to `farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())`, snake_case↔camelCase conversion helpers in `src/lib/db.ts`.
- **Styling**: Tailwind CSS with a `farm`/`earth`/`sky` colour system, dark mode via a `dark` class on `<html>` (not OS media query).

## Pages at this point

`DashboardPage`, `PaddocksPage`, `LivestockPage`, `CropsPage`, `EquipmentPage`, `FinancePage`, `InventoryPage`, `TasksPage`, `WeatherPage`, `CompliancePage`, `ReportsPage`, `SettingsPage`, plus auth and onboarding flows.

Everything from [02](02-public-website.md) onward builds on top of this.
