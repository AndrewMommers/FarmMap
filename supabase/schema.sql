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

-- ── Farm Users (Team members) ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS farm_users (
  id         TEXT PRIMARY KEY,
  farm_id    TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'operator',
  phone      TEXT,
  avatar     TEXT,
  active     BOOLEAN DEFAULT TRUE,
  last_login TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
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

-- ============================================================
-- Realtime — enable replication on key tables
-- Run in Supabase Dashboard → Database → Replication, OR:
-- ============================================================

-- ALTER PUBLICATION supabase_realtime ADD TABLE paddocks, tasks, transactions, inventory, livestock_mobs;
