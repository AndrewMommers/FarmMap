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
  -- a row with user_id = NULL is either a contact-only entry, or a pending
  -- invite waiting to be claimed (see farm_users_claim_own_invite policy).
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'operator',
  phone      TEXT,
  avatar     TEXT,
  active     BOOLEAN DEFAULT TRUE,
  last_login TEXT,
  -- Sparse per-resource override on top of the role's default permissions,
  -- e.g. {"finance": "read"} grants this one person read access to finance
  -- even though their role otherwise wouldn't. NULL = pure role defaults.
  -- No owner-facing UI to edit this yet — see docs/FEATURES.md.
  custom_permissions JSONB,
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

-- ── Announcements ────────────────────────────────────────────────────────────
-- A simple farm-wide broadcast feed — anyone with access to the farm posts,
-- everyone sees it. Not threaded, no DMs; author_name is denormalized so
-- posts still display correctly for farm_users rows without their own
-- Supabase Auth login (see docs/DEVICES.md on the current single-owner-auth
-- reality).

CREATE TABLE IF NOT EXISTS announcements (
  id          TEXT PRIMARY KEY,
  farm_id     TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Migrations — safe to re-run against an already-deployed database.
-- (New installs get these columns from the CREATE TABLE statements above
-- already; these ALTERs exist purely to bring existing databases up to date.)
-- Must run before the RLS section below — several policies/functions there
-- reference columns added here (farm_users.user_id, custom_permissions).
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
ALTER TABLE farm_users ADD COLUMN IF NOT EXISTS custom_permissions JSONB;

ALTER TABLE devices ADD COLUMN IF NOT EXISTS last_location    JSONB;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS last_location_at TIMESTAMPTZ;

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
ALTER TABLE announcements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_tokens      ENABLE ROW LEVEL SECURITY; -- no policies — service_role only

-- ── Access model ─────────────────────────────────────────────────────────────
-- Two functions, called from every table's policies below, are the single
-- source of truth for "who can do what" — see docs/versions/ for the design
-- writeup. SECURITY DEFINER so they can read farms/farm_users without
-- recursing into those tables' own RLS.

-- Resolves the caller's role for a farm: 'owner' if they own it, their
-- farm_users.role if they're an active member, NULL if neither (no access).
CREATE OR REPLACE FUNCTION get_farm_role(check_farm_id TEXT)
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM farms WHERE id = check_farm_id AND user_id = auth.uid()) THEN 'owner'
    ELSE (SELECT role FROM farm_users WHERE farm_id = check_farm_id AND user_id = auth.uid() AND active = true LIMIT 1)
  END;
$$;

-- The role permission matrix, encoded once. resource groups related tables
-- (e.g. 'livestock' covers both livestock_mobs and livestock_animals);
-- action is 'read' or 'write'. Checks a per-user custom_permissions override
-- first, then falls back to the role default. Owner always passes.
CREATE OR REPLACE FUNCTION has_farm_permission(check_farm_id TEXT, resource TEXT, action TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  r TEXT;
  overrides JSONB;
  override_val TEXT;
BEGIN
  r := get_farm_role(check_farm_id);
  IF r IS NULL THEN RETURN false; END IF;
  IF r = 'owner' THEN RETURN true; END IF;

  SELECT custom_permissions INTO overrides FROM farm_users
    WHERE farm_id = check_farm_id AND user_id = auth.uid() AND active = true LIMIT 1;
  IF overrides IS NOT NULL AND overrides ? resource THEN
    override_val := overrides ->> resource;
    RETURN override_val = 'write' OR (override_val = 'read' AND action = 'read');
  END IF;

  RETURN CASE resource
    WHEN 'paddocks'      THEN r IN ('manager','operator') OR (action = 'read' AND r IN ('agronomist','accountant','readonly'))
    WHEN 'livestock'     THEN r IN ('manager','operator') OR (action = 'read' AND r IN ('agronomist','accountant','readonly'))
    WHEN 'crops'         THEN r IN ('manager','operator','agronomist') OR (action = 'read' AND r IN ('accountant','readonly'))
    WHEN 'equipment'     THEN r IN ('manager','operator') OR (action = 'read' AND r IN ('agronomist','accountant','readonly'))
    WHEN 'finance'       THEN r IN ('manager','accountant') OR (action = 'read' AND r IN ('operator','readonly'))
    WHEN 'inventory'     THEN r IN ('manager','operator') OR (action = 'read' AND r IN ('agronomist','accountant','readonly'))
    WHEN 'tasks'         THEN r IN ('manager','operator','agronomist') OR (action = 'read' AND r IN ('accountant','readonly'))
    WHEN 'devices'       THEN r IN ('manager','operator') OR (action = 'read' AND r = 'readonly')
    WHEN 'announcements' THEN true
    WHEN 'team'          THEN action = 'read'
    WHEN 'integrations'  THEN action = 'read' AND r = 'manager'
    ELSE false
  END;
END;
$$;

-- Drop every policy this file has ever created, by name, so this script is
-- safe to re-run against an already-deployed database — Postgres has no
-- "CREATE POLICY IF NOT EXISTS".
DROP POLICY IF EXISTS farms_owner ON farms;
DROP POLICY IF EXISTS farms_read ON farms;
DROP POLICY IF EXISTS farms_write ON farms;
DROP POLICY IF EXISTS paddocks_owner ON paddocks;
DROP POLICY IF EXISTS paddocks_read ON paddocks;
DROP POLICY IF EXISTS paddocks_write ON paddocks;
DROP POLICY IF EXISTS livestock_mobs_owner ON livestock_mobs;
DROP POLICY IF EXISTS livestock_mobs_read ON livestock_mobs;
DROP POLICY IF EXISTS livestock_mobs_write ON livestock_mobs;
DROP POLICY IF EXISTS livestock_animals_owner ON livestock_animals;
DROP POLICY IF EXISTS livestock_animals_read ON livestock_animals;
DROP POLICY IF EXISTS livestock_animals_write ON livestock_animals;
DROP POLICY IF EXISTS crops_owner ON crops;
DROP POLICY IF EXISTS crops_read ON crops;
DROP POLICY IF EXISTS crops_write ON crops;
DROP POLICY IF EXISTS spray_records_owner ON spray_records;
DROP POLICY IF EXISTS spray_records_read ON spray_records;
DROP POLICY IF EXISTS spray_records_write ON spray_records;
DROP POLICY IF EXISTS equipment_owner ON equipment;
DROP POLICY IF EXISTS equipment_read ON equipment;
DROP POLICY IF EXISTS equipment_write ON equipment;
DROP POLICY IF EXISTS maintenance_logs_owner ON maintenance_logs;
DROP POLICY IF EXISTS maintenance_logs_read ON maintenance_logs;
DROP POLICY IF EXISTS maintenance_logs_write ON maintenance_logs;
DROP POLICY IF EXISTS transactions_owner ON transactions;
DROP POLICY IF EXISTS transactions_read ON transactions;
DROP POLICY IF EXISTS transactions_write ON transactions;
DROP POLICY IF EXISTS budgets_owner ON budgets;
DROP POLICY IF EXISTS budgets_read ON budgets;
DROP POLICY IF EXISTS budgets_write ON budgets;
DROP POLICY IF EXISTS inventory_owner ON inventory;
DROP POLICY IF EXISTS inventory_read ON inventory;
DROP POLICY IF EXISTS inventory_write ON inventory;
DROP POLICY IF EXISTS tasks_owner ON tasks;
DROP POLICY IF EXISTS tasks_read ON tasks;
DROP POLICY IF EXISTS tasks_write ON tasks;
DROP POLICY IF EXISTS farm_users_owner ON farm_users;
DROP POLICY IF EXISTS farm_users_read ON farm_users;
DROP POLICY IF EXISTS farm_users_write ON farm_users;
DROP POLICY IF EXISTS farm_users_claim_own_invite ON farm_users;
DROP POLICY IF EXISTS devices_owner ON devices;
DROP POLICY IF EXISTS devices_read ON devices;
DROP POLICY IF EXISTS devices_write ON devices;
DROP POLICY IF EXISTS geofence_events_owner ON geofence_events;
DROP POLICY IF EXISTS geofence_events_access ON geofence_events;
DROP POLICY IF EXISTS announcements_owner ON announcements;
DROP POLICY IF EXISTS announcements_access ON announcements;
DROP POLICY IF EXISTS integration_connections_owner ON integration_connections;
DROP POLICY IF EXISTS integration_connections_read ON integration_connections;
DROP POLICY IF EXISTS integration_connections_write ON integration_connections;

-- Farms: any member can read; only the owner can rename/delete the farm itself.
CREATE POLICY farms_read  ON farms FOR SELECT USING (user_id = auth.uid() OR get_farm_role(id) IS NOT NULL);
CREATE POLICY farms_write ON farms FOR ALL    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Operational tables: role-gated read/write via has_farm_permission().
CREATE POLICY paddocks_read  ON paddocks FOR SELECT USING (has_farm_permission(farm_id, 'paddocks', 'read'));
CREATE POLICY paddocks_write ON paddocks FOR ALL    USING (has_farm_permission(farm_id, 'paddocks', 'write')) WITH CHECK (has_farm_permission(farm_id, 'paddocks', 'write'));

CREATE POLICY livestock_mobs_read  ON livestock_mobs FOR SELECT USING (has_farm_permission(farm_id, 'livestock', 'read'));
CREATE POLICY livestock_mobs_write ON livestock_mobs FOR ALL    USING (has_farm_permission(farm_id, 'livestock', 'write')) WITH CHECK (has_farm_permission(farm_id, 'livestock', 'write'));

CREATE POLICY livestock_animals_read  ON livestock_animals FOR SELECT USING (has_farm_permission(farm_id, 'livestock', 'read'));
CREATE POLICY livestock_animals_write ON livestock_animals FOR ALL    USING (has_farm_permission(farm_id, 'livestock', 'write')) WITH CHECK (has_farm_permission(farm_id, 'livestock', 'write'));

CREATE POLICY crops_read  ON crops FOR SELECT USING (has_farm_permission(farm_id, 'crops', 'read'));
CREATE POLICY crops_write ON crops FOR ALL    USING (has_farm_permission(farm_id, 'crops', 'write')) WITH CHECK (has_farm_permission(farm_id, 'crops', 'write'));

CREATE POLICY spray_records_read  ON spray_records FOR SELECT USING (has_farm_permission(farm_id, 'crops', 'read'));
CREATE POLICY spray_records_write ON spray_records FOR ALL    USING (has_farm_permission(farm_id, 'crops', 'write')) WITH CHECK (has_farm_permission(farm_id, 'crops', 'write'));

CREATE POLICY equipment_read  ON equipment FOR SELECT USING (has_farm_permission(farm_id, 'equipment', 'read'));
CREATE POLICY equipment_write ON equipment FOR ALL    USING (has_farm_permission(farm_id, 'equipment', 'write')) WITH CHECK (has_farm_permission(farm_id, 'equipment', 'write'));

CREATE POLICY maintenance_logs_read  ON maintenance_logs FOR SELECT
  USING (equipment_id IN (SELECT id FROM equipment WHERE has_farm_permission(farm_id, 'equipment', 'read')));
CREATE POLICY maintenance_logs_write ON maintenance_logs FOR ALL
  USING (equipment_id IN (SELECT id FROM equipment WHERE has_farm_permission(farm_id, 'equipment', 'write')))
  WITH CHECK (equipment_id IN (SELECT id FROM equipment WHERE has_farm_permission(farm_id, 'equipment', 'write')));

CREATE POLICY transactions_read  ON transactions FOR SELECT USING (has_farm_permission(farm_id, 'finance', 'read'));
CREATE POLICY transactions_write ON transactions FOR ALL    USING (has_farm_permission(farm_id, 'finance', 'write')) WITH CHECK (has_farm_permission(farm_id, 'finance', 'write'));

CREATE POLICY budgets_read  ON budgets FOR SELECT USING (has_farm_permission(farm_id, 'finance', 'read'));
CREATE POLICY budgets_write ON budgets FOR ALL    USING (has_farm_permission(farm_id, 'finance', 'write')) WITH CHECK (has_farm_permission(farm_id, 'finance', 'write'));

CREATE POLICY inventory_read  ON inventory FOR SELECT USING (has_farm_permission(farm_id, 'inventory', 'read'));
CREATE POLICY inventory_write ON inventory FOR ALL    USING (has_farm_permission(farm_id, 'inventory', 'write')) WITH CHECK (has_farm_permission(farm_id, 'inventory', 'write'));

CREATE POLICY tasks_read  ON tasks FOR SELECT USING (has_farm_permission(farm_id, 'tasks', 'read'));
CREATE POLICY tasks_write ON tasks FOR ALL    USING (has_farm_permission(farm_id, 'tasks', 'write')) WITH CHECK (has_farm_permission(farm_id, 'tasks', 'write'));

CREATE POLICY devices_read  ON devices FOR SELECT USING (has_farm_permission(farm_id, 'devices', 'read'));
CREATE POLICY devices_write ON devices FOR ALL    USING (has_farm_permission(farm_id, 'devices', 'write')) WITH CHECK (has_farm_permission(farm_id, 'devices', 'write'));

-- Announcements: every active member, any role, can read and post — the whole
-- point is open team communication, so no read/write split is needed.
CREATE POLICY announcements_access ON announcements FOR ALL
  USING (has_farm_permission(farm_id, 'announcements', 'write')) WITH CHECK (has_farm_permission(farm_id, 'announcements', 'write'));

-- Geofence events: system-logged device telemetry, not a user-facing write
-- surface with role nuance — any active member can read/write.
CREATE POLICY geofence_events_access ON geofence_events FOR ALL
  USING (get_farm_role(farm_id) IS NOT NULL) WITH CHECK (get_farm_role(farm_id) IS NOT NULL);

-- Team directory: every member can see who's on the team; only the owner can
-- invite, edit roles, or remove anyone — team roster changes are identity-
-- adjacent, not operational data, so this is NOT role-gated like the tables
-- above (a 'manager' does not get to add or remove other members).
--
-- The extra OR clauses exist for the claim policy below to actually work:
-- Postgres RLS gates UPDATE on an applicable SELECT policy for BOTH the old
-- row (pre-update) and the new row (post-update, as part of WITH CHECK) —
-- independent of the UPDATE policy's own USING/WITH CHECK. A fresh invitee
-- can't see their own row via get_farm_role() either before claiming (not a
-- member yet) or immediately after (get_farm_role does its own subquery,
-- which can't see this same statement's not-yet-committed update), so both
-- states need their own direct, non-subquery clause here: "it's unclaimed
-- and addressed to me" (pre-claim) and "it's now literally mine" (post-claim).
CREATE POLICY farm_users_read  ON farm_users FOR SELECT USING (
  get_farm_role(farm_id) IS NOT NULL
  OR user_id = auth.uid()
  OR (user_id IS NULL AND LOWER(email) = LOWER(auth.jwt() ->> 'email'))
);
CREATE POLICY farm_users_write ON farm_users FOR ALL
  USING (farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid()));

-- Lets a freshly-authenticated invitee claim the one unlinked farm_users row
-- that matches their own verified JWT email — nothing else. This is what
-- lets AcceptInvitePage link a new login to its farm_users row without
-- needing a second privileged (service_role) round-trip.
CREATE POLICY farm_users_claim_own_invite ON farm_users
  FOR UPDATE
  USING (user_id IS NULL AND LOWER(email) = LOWER(auth.jwt() ->> 'email'))
  WITH CHECK (user_id = auth.uid() AND LOWER(email) = LOWER(auth.jwt() ->> 'email'));

-- Integration connections: farm owner can read/manage status rows; managers
-- get read-only visibility. Never the token vault above (integration_tokens
-- has no policies at all, regardless of role).
CREATE POLICY integration_connections_read  ON integration_connections FOR SELECT
  USING (has_farm_permission(farm_id, 'integrations', 'read') OR farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid()));
CREATE POLICY integration_connections_write ON integration_connections FOR ALL
  USING (farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid()));

-- ============================================================
-- FarmMap Staff Portal + Support Centre
-- ============================================================

-- ── Platform staff ───────────────────────────────────────────────────────────
-- Distinct from any farm's per-farm role (owner/manager/etc.) — this is a
-- platform-wide permission. No client-facing RLS policies at all (same
-- pattern as integration_tokens): only the staff-portal Edge Function, using
-- the service_role key, ever reads or writes this table. Deliberately NOT
-- OR'd into any customer-facing RLS policy — see docs/versions/ for why
-- (loosening farms_read etc. for staff would leak every customer's farm into
-- a staff member's own ordinary dashboard load).
CREATE TABLE IF NOT EXISTS platform_staff (
  email      TEXT PRIMARY KEY,   -- always stored lowercased
  tier       TEXT NOT NULL DEFAULT 'external' CHECK (tier IN ('internal','external')),
  is_admin   BOOLEAN NOT NULL DEFAULT false,
  active     BOOLEAN NOT NULL DEFAULT true,
  added_by   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE platform_staff ENABLE ROW LEVEL SECURITY;

-- Bootstrap Administrator so someone can add external staff from day one.
INSERT INTO platform_staff (email, tier, is_admin, added_by)
VALUES (LOWER('andrew.mommers@gmail.com'), 'internal', true, 'system')
ON CONFLICT (email) DO NOTHING;

-- Every staff action (view/fix/reply), service_role-only, same as above.
CREATE TABLE IF NOT EXISTS staff_audit_log (
  id          BIGSERIAL PRIMARY KEY,
  staff_email TEXT NOT NULL,
  farm_id     TEXT REFERENCES farms(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  detail      JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE staff_audit_log ENABLE ROW LEVEL SECURITY;

-- ── Support tickets ──────────────────────────────────────────────────────────
-- Unlike platform_staff above, these ARE customer-facing — any active farm
-- member can raise/read/update their own farm's tickets, same "open within
-- the farm" reasoning as announcements_access below. Staff read/reply across
-- every farm's tickets exclusively through the staff-portal function.

CREATE TABLE IF NOT EXISTS support_tickets (
  id                   TEXT PRIMARY KEY,
  farm_id              TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  subject              TEXT NOT NULL,
  category             TEXT NOT NULL DEFAULT 'general', -- 'account' | 'bug' | 'question' | 'general'
  status               TEXT NOT NULL DEFAULT 'open',     -- 'open' | 'in_progress' | 'resolved' | 'closed'
  priority             TEXT NOT NULL DEFAULT 'normal',   -- 'low' | 'normal' | 'high'
  created_by_name      TEXT NOT NULL,
  created_by_email     TEXT NOT NULL,
  -- Set only via the staff-portal function (self-assign). RLS can't restrict
  -- individual columns, so a customer's own client could technically write
  -- this directly — low-stakes (informational only, no elevated access) and
  -- simply never exposed as a field in the customer-facing UI.
  assigned_staff_email TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id           TEXT PRIMARY KEY,
  ticket_id    TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_type  TEXT NOT NULL,  -- 'customer' | 'staff'
  author_name  TEXT NOT NULL,
  author_email TEXT,
  message      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE support_tickets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_tickets_access ON support_tickets;
DROP POLICY IF EXISTS support_ticket_messages_access ON support_ticket_messages;

CREATE POLICY support_tickets_access ON support_tickets FOR ALL
  USING (get_farm_role(farm_id) IS NOT NULL)
  WITH CHECK (get_farm_role(farm_id) IS NOT NULL);

CREATE POLICY support_ticket_messages_access ON support_ticket_messages FOR ALL
  USING (ticket_id IN (SELECT id FROM support_tickets WHERE get_farm_role(farm_id) IS NOT NULL))
  WITH CHECK (ticket_id IN (SELECT id FROM support_tickets WHERE get_farm_role(farm_id) IS NOT NULL));

-- ── Client error log ─────────────────────────────────────────────────────────
-- Feeds the Staff Portal's "Recent Errors" section so staff can see what
-- actually broke for a customer instead of relying on their description.
-- Customers can insert and read back only their own rows (harmless — it's
-- their own diagnostic data); staff read across every customer exclusively
-- through the staff-portal function's service_role client, same as always.
--
-- The read policy isn't optional even though customers don't need it in the
-- UI: Postgres RLS requires a freshly-inserted row to also pass an
-- applicable SELECT policy, not just the INSERT policy's own WITH CHECK —
-- the same gotcha already hit (in the opposite direction, for UPDATE) with
-- farm_users_claim_own_invite. An insert-only table with zero SELECT policy
-- can never actually be inserted into.

CREATE TABLE IF NOT EXISTS client_error_log (
  id         BIGSERIAL PRIMARY KEY,
  farm_id    TEXT REFERENCES farms(id) ON DELETE SET NULL,  -- nullable: errors can happen pre-onboarding
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  message    TEXT NOT NULL,
  stack      TEXT,
  path       TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE client_error_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_error_log_insert ON client_error_log;
DROP POLICY IF EXISTS client_error_log_read ON client_error_log;

CREATE POLICY client_error_log_insert ON client_error_log FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY client_error_log_read ON client_error_log FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
-- Realtime — enable replication on key tables
-- Run in Supabase Dashboard → Database → Replication, OR:
-- ============================================================

-- ALTER PUBLICATION supabase_realtime ADD TABLE paddocks, tasks, transactions, inventory, livestock_mobs, announcements;
