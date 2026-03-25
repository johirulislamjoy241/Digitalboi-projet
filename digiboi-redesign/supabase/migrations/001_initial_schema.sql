-- ═══════════════════════════════════════════════════════
--  Digiboi — Supabase Database Schema
--  Converted from Airtable → PostgreSQL (Supabase)
-- ═══════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. Users (Login) Table ──────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  shop_name   TEXT NOT NULL,
  owner_name  TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Registrations (Full Business Profile) ───────────
CREATE TABLE IF NOT EXISTS registrations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  shop_name    TEXT NOT NULL,
  shop_type    TEXT,
  country      TEXT,
  state_div    TEXT,
  city         TEXT,
  address      TEXT,
  shop_phone   TEXT,
  shop_email   TEXT,
  owner_name   TEXT NOT NULL,
  owner_phone  TEXT,
  owner_email  TEXT,
  nid          TEXT UNIQUE,
  dob          DATE,
  gender       TEXT,
  login_phone  TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Inventory (Products) ─────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  category     TEXT DEFAULT 'General',
  quantity     NUMERIC DEFAULT 0,
  unit         TEXT DEFAULT 'pcs',
  buy_price    NUMERIC DEFAULT 0,
  sell_price   NUMERIC DEFAULT 0,
  status       TEXT DEFAULT 'In Stock' CHECK (status IN ('In Stock','Low Stock','Out of Stock','Archived')),
  notes        TEXT,
  image_url    TEXT,
  product_link TEXT,
  profit       NUMERIC GENERATED ALWAYS AS (sell_price - buy_price) STORED,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Transactions ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES inventory(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('Stock In','Stock Out','Price Update','Due Payment','Loss')),
  txn_type     TEXT CHECK (txn_type IN ('in','out','price','payment')),
  quantity     NUMERIC DEFAULT 0,
  unit         TEXT DEFAULT 'pcs',
  buy_price    NUMERIC DEFAULT 0,
  sell_price   NUMERIC DEFAULT 0,
  profit_loss  NUMERIC DEFAULT 0,
  old_qty      NUMERIC DEFAULT 0,
  new_qty      NUMERIC DEFAULT 0,
  notes        TEXT,
  date         TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. Due Ledger ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS due_ledger (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  buyer_id        UUID,
  buyer_name      TEXT NOT NULL,
  product_id      UUID REFERENCES inventory(id) ON DELETE SET NULL,
  product_name    TEXT,
  quantity        NUMERIC DEFAULT 0,
  unit            TEXT DEFAULT 'pcs',
  unit_price      NUMERIC DEFAULT 0,
  total_amount    NUMERIC DEFAULT 0,
  paid_amount     NUMERIC DEFAULT 0,
  remaining       NUMERIC GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  status          TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Partial','Paid')),
  due_date        DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. Buyers (Profiles) ────────────────────────────────
CREATE TABLE IF NOT EXISTS buyers (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  phone        TEXT,
  email        TEXT,
  address      TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_inventory_user   ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_txn_user         ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_txn_date         ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_due_user         ON due_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_due_status       ON due_ledger(status);
CREATE INDEX IF NOT EXISTS idx_buyers_user      ON buyers(user_id);

-- ── Auto-update updated_at ───────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_updated
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_due_updated
  BEFORE UPDATE ON due_ledger
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Row Level Security ───────────────────────────────────
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory    ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE due_ledger   ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers       ENABLE ROW LEVEL SECURITY;

-- Users can only read/modify their own data
-- (Auth handled via custom JWT stored in httpOnly cookie)
-- For API routes using service_role key, RLS is bypassed.
