-- ============================================================
-- FarmMap — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── Farms ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS farms (
  id            TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  owner         TEXT NOT NULL DEFAULT '',
  type          TEXT NOT NULL DEFAULT 'mixed',
  total_hectares NUMERIC DEFAULT 0,
  state         TEXT DEFAULT 'NSW',
  region        TEXT DEFAULT '',
  address       TEXT DEFAULT '',
  abn           TEXT DEFAULT '',
  created_at    TEXT DEFAULT (to_char(NOW(), 'YYYY-MM-DD'))
);

-- ── Paddocks ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS paddocks (
  id            TEXT PRIMARY KEY,
  farm_id       TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  hectares      NUMERIC DEFAULT 0,
  soil_type     TEXT DEFAULT '',
  status        TEXT DEFAULT 'active',
  current_crop  TEXT,
  last_activity TEXT,
  notes         TEXT,
  coordinates   JSONB,           -- [lat, lng] centroid
  polygon       JSONB,           -- [[lat,lng], ...] drawn boundary
  external_provider     TEXT,    -- e.g. 'john_deere' if imported/matched from a telematics platform
  external_boundary_id  TEXT,    -- provider's field boundary ID
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Livestock Mobs ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS livestock_mobs (
  id         TEXT PRIMARY KEY,
  farm_id    TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  species    TEXT NOT NULL,
  count      INTEGER DEFAULT 0,
  paddock_id TEXT REFERENCES paddocks(id) ON DELETE SET NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Livestock Animals ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS livestock_animals (
  id                 TEXT PRIMARY KEY,
  farm_id            TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  tag                TEXT NOT NULL,
  species            TEXT NOT NULL,
  breed              TEXT DEFAULT '',
  gender             TEXT NOT NULL DEFAULT 'female',
  dob                TEXT,
  weight_kg          NUMERIC,
  status             TEXT DEFAULT 'healthy',
  paddock_id         TEXT REFERENCES paddocks(id) ON DELETE SET NULL,
  mob_id             TEXT REFERENCES livestock_mobs(id) ON DELETE SET NULL,
  notes              TEXT,
  last_vet_visit     TEXT,
  purchase_date      TEXT,
  purchase_price_aud NUMERIC,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── Crops ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crops (
  id                       TEXT PRIMARY KEY,
  farm_id                  TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  paddock_id               TEXT NOT NULL REFERENCES paddocks(id) ON DELETE CASCADE,
  crop_name                TEXT NOT NULL,
  variety                  TEXT,
  season                   TEXT NOT NULL,
  planting_date            TEXT,
  expected_harvest_date    TEXT,
  actual_harvest_date      TEXT,
  status                   TEXT DEFAULT 'planned',
  seed_rate_kg_ha          NUMERIC,
  expected_yield_tonnes_ha NUMERIC,
  actual_yield_tonnes_ha   NUMERIC,
  irrigated                BOOLEAN DEFAULT FALSE,
  notes                    TEXT,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ── Spray Records ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS spray_records (
  id               TEXT PRIMARY KEY,
  farm_id          TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  paddock_id       TEXT NOT NULL REFERENCES paddocks(id) ON DELETE CASCADE,
  date             TEXT NOT NULL,
  product          TEXT NOT NULL,
  rate_per_ha      NUMERIC,
  unit             TEXT,
  operator         TEXT,
  withholding_days INTEGER,
  purpose          TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Equipment ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS equipment (
  id                 TEXT PRIMARY KEY,
  farm_id            TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  category           TEXT DEFAULT 'other',
  make               TEXT DEFAULT '',
  model              TEXT DEFAULT '',
  year               INTEGER,
  serial_number      TEXT,
  status             TEXT DEFAULT 'operational',
  last_service_date  TEXT,
  next_service_date  TEXT,
  hours_or_km        NUMERIC,
  purchase_date      TEXT,
  purchase_price_aud NUMERIC,
  notes              TEXT,
  external_provider    TEXT,     -- e.g. 'john_deere' if synced from a telematics platform
  external_id          TEXT,     -- provider's machine/asset ID
  engine_hours_synced  NUMERIC,  -- last engine-hours reading pulled from the provider
  last_telemetry_at    TIMESTAMPTZ,
  last_location        JSONB,    -- [lat, lng] of last known machine position
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── Maintenance Logs ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id           TEXT PRIMARY KEY,
  equipment_id TEXT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  date         TEXT NOT NULL,
  type         TEXT NOT NULL,
  description  TEXT NOT NULL,
  cost_aud     NUMERIC,
  technician   TEXT,
  next_due_date TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Transactions ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transactions (
  id             TEXT PRIMARY KEY,
  farm_id        TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  date           TEXT NOT NULL,
  type           TEXT NOT NULL,
  category       TEXT NOT NULL,
  description    TEXT NOT NULL,
  amount_aud     NUMERIC NOT NULL DEFAULT 0,
  gst_included   BOOLEAN DEFAULT TRUE,
  supplier       TEXT,
  invoice_number TEXT,
  paddock_id     TEXT REFERENCES paddocks(id) ON DELETE SET NULL,
  notes          TEXT,
  external_provider TEXT,      -- e.g. 'xero' (accounting sync) or 'zepto' (bank payment)
  external_id       TEXT,      -- provider's transaction/invoice/payment ID
  payment_status    TEXT,      -- 'pending' | 'completed' | 'failed' — mainly for Zepto payments
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Budgets ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS budgets (
  id             TEXT PRIMARY KEY,
  farm_id        TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  financial_year TEXT NOT NULL,
  category       TEXT NOT NULL,
  budgeted_aud   NUMERIC DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Inventory ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS inventory (
  id              TEXT PRIMARY KEY,
  farm_id         TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        TEXT DEFAULT 'other',
  unit            TEXT DEFAULT 'unit',
  quantity        NUMERIC DEFAULT 0,
  min_stock_level NUMERIC,
  location        TEXT,
  supplier        TEXT,
  cost_per_unit   NUMERIC,
  expiry_date     TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tasks ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tasks (
  id             TEXT PRIMARY KEY,
  farm_id        TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  status         TEXT DEFAULT 'todo',
  priority       TEXT DEFAULT 'medium',
  assigned_to    TEXT,
  due_date       TEXT,
  completed_date TEXT,
  paddock_id     TEXT REFERENCES paddocks(id) ON DELETE SET NULL,
  equipment_id   TEXT REFERENCES equipment(id) ON DELETE SET NULL,
  category       TEXT DEFAULT 'general',
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Equipment Telematics Integrations ───────────────────────────────────────
-- A farm connects an external ag-telematics platform (John Deere Operations
-- Center, and others in future) via OAuth so machine hours, GPS location and
-- field boundaries can sync automatically. OAuth tokens are split into a
-- separate table with NO client-facing RLS policies at all — only Supabase
-- Edge Functions running with the service_role key (which bypasses RLS
-- entirely) can read or write them. The browser/anon/authenticated roles can
-- never see a token, even indirectly, only the connection's status/metadata.

CREATE TABLE IF NOT EXISTS integration_connections (
  id                TEXT PRIMARY KEY,
  farm_id           TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL,                 -- e.g. 'john_deere'
  status            TEXT NOT NULL DEFAULT 'disconnected',
  external_org_id   TEXT,
  external_org_name TEXT,
  scopes            TEXT[],
  connected_at      TIMESTAMPTZ,
  last_sync_at      TIMESTAMPTZ,
  last_error        TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (farm_id, provider)
);

-- Tokens live here, never in integration_connections. No RLS policies are
-- defined for this table on purpose — RLS is enabled with zero policies,
-- which denies ALL access to anon/authenticated roles by default. Only
-- service_role (used exclusively by Edge Functions) can touch it.
CREATE TABLE IF NOT EXISTS integration_tokens (
  connection_id  TEXT PRIMARY KEY REFERENCES integration_connections(id) ON DELETE CASCADE,
  access_token   TEXT NOT NULL,
  refresh_token  TEXT,
  expires_at     TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Farm Users (Team members) ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS farm_users (
  id         TEXT PRIMARY KEY,
  farm_id    TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  -- Links this directory row to a real login, when one exists. Nullable:
  -- most team members here are contacts entered by the owner, not logins.
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'operator',
  phone      TEXT,
  avatar     TEXT,
  active     BOOLEAN DEFAULT TRUE,
  last_login TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Devices (Tractor Mode) ─────────────────────────────────────────────────────
-- Registered from inside the cab, on an already-authenticated device — see
-- docs/DEVICES.md. Naming/assigning/revoking a device is farm-owner-only;
-- revocation is enforced client-side (forces sign-out next time that device
-- checks in), not by cutting off a scoped credential — there isn't one.

CREATE TABLE IF NOT EXISTS devices (
  id               TEXT PRIMARY KEY,
  farm_id          TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  assigned_user_id TEXT REFERENCES farm_users(id) ON DELETE SET NULL,
  status           TEXT NOT NULL DEFAULT 'active',
  last_active_at   TIMESTAMPTZ,
  -- GPS position, foreground-only, reported while Tractor Mode is open on
  -- this device — see docs/GEOFENCING.md.
  last_location    JSONB,          -- [lat, lng]
  last_location_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Geofence Events ──────────────────────────────────────────────────────────
-- A device's live position is checked against paddock boundaries (reusing
-- Paddock.polygon rather than a separate zone-drawing tool). Crossing a
-- boundary logs a row here.

CREATE TABLE IF NOT EXISTS geofence_events (
  id          TEXT PRIMARY KEY,
  farm_id     TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  device_id   TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  paddock_id  TEXT NOT NULL REFERENCES paddocks(id) ON DELETE CASCADE,
  type        TEXT NOT NULL, -- 'enter' | 'exit'
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE farms          ENABLE ROW LEVEL SECURITY;
ALTER TABLE paddocks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestock_mobs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestock_animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crops           ENABLE ROW LEVEL SECURITY;
ALTER TABLE spray_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment       ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices         ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_tokens      ENABLE ROW LEVEL SECURITY; -- no policies — service_role only

-- Farms: owner only
CREATE POLICY farms_owner ON farms FOR ALL USING (user_id = auth.uid());

-- Helper: check if a farm belongs to the current user
-- All other tables reference farms via farm_id or indirectly via equipment_id

CREATE POLICY paddocks_owner        ON paddocks        FOR ALL USING (farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid()));
CREATE POLICY livestock_mobs_owner  ON livestock_mobs  FOR ALL USING (farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid()));
CREATE POLICY livestock_animals_owner ON livestock_animals FOR ALL USING (farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid()));
CREATE POLICY crops_owner           ON crops           FOR ALL USING (farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid()));
CREATE POLICY spray_records_owner   ON spray_records   FOR ALL USING (farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid()));
CREATE POLICY equipment_owner       ON equipment       FOR ALL USING (farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid()));
CREATE POLICY maintenance_logs_owner ON maintenance_logs FOR ALL USING (equipment_id IN (SELECT id FROM equipment WHERE farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())));
CREATE POLICY transactions_owner    ON transactions    FOR ALL USING (farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid()));
CREATE POLICY budgets_owner         ON budgets         FOR ALL USING (farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid()));
CREATE POLICY inventory_owner       ON inventory       FOR ALL USING (farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid()));
CREATE POLICY tasks_owner           ON tasks           FOR ALL USING (farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid()));
CREATE POLICY farm_users_owner      ON farm_users      FOR ALL USING (farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid()));
CREATE POLICY devices_owner         ON devices         FOR ALL USING (farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid()));
CREATE POLICY geofence_events_owner ON geofence_events FOR ALL USING (farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid()));

-- Integration connections: farm owner can read/manage status rows, but never
-- the token vault above (integration_tokens has no policies at all).
CREATE POLICY integration_connections_owner ON integration_connections FOR ALL
  USING (farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid()));

-- ============================================================
-- Migrations — safe to re-run against an already-deployed database.
-- (New installs get these columns from the CREATE TABLE statements above
-- already; these ALTERs exist purely to bring existing databases up to date.)
-- ============================================================

ALTER TABLE paddocks  ADD COLUMN IF NOT EXISTS external_provider    TEXT;
ALTER TABLE paddocks  ADD COLUMN IF NOT EXISTS external_boundary_id TEXT;

ALTER TABLE equipment ADD COLUMN IF NOT EXISTS external_provider   TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS external_id         TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS engine_hours_synced NUMERIC;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS last_telemetry_at   TIMESTAMPTZ;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS last_location       JSONB;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS external_provider TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS external_id       TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_status    TEXT;

ALTER TABLE farm_users ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE devices ADD COLUMN IF NOT EXISTS last_location    JSONB;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS last_location_at TIMESTAMPTZ;

-- ============================================================
-- Realtime — enable replication on key tables
-- Run in Supabase Dashboard → Database → Replication, OR:
-- ============================================================

-- ALTER PUBLICATION supabase_realtime ADD TABLE paddocks, tasks, transactions, inventory, livestock_mobs;
