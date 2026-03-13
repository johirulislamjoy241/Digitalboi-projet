-- ============================================================
-- DIGIBOI v2 — Complete Database Schema
-- Supabase SQL Editor এ Run করুন
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- পুরনো সব মুছে নতুন করে শুরু
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS otp_requests CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS purchase_items CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS shops CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ─── USERS ────────────────────────────────────────────────
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone           VARCHAR(20)  UNIQUE,
  email           VARCHAR(255) UNIQUE,
  password_hash   TEXT         NOT NULL,
  full_name       VARCHAR(255) NOT NULL,
  role            VARCHAR(30)  NOT NULL DEFAULT 'owner'
                    CHECK (role IN ('super_admin','owner','manager','cashier','stock_manager','viewer')),
  profile_photo   TEXT,
  nid_number      VARCHAR(30),
  nid_front_photo TEXT,
  nid_back_photo  TEXT,
  nid_verified    BOOLEAN      NOT NULL DEFAULT false,
  is_active       BOOLEAN      NOT NULL DEFAULT true,
  is_blocked      BOOLEAN      NOT NULL DEFAULT false,
  last_login      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── SHOPS ────────────────────────────────────────────────
CREATE TABLE shops (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_name            VARCHAR(255) NOT NULL,
  business_type        VARCHAR(20)  NOT NULL DEFAULT 'physical'
                         CHECK (business_type IN ('physical','online','both')),
  shop_logo            TEXT,
  shop_photos          TEXT[]      DEFAULT '{}',
  address              TEXT,
  district             VARCHAR(100),
  phone                VARCHAR(20),
  email                VARCHAR(255),
  trade_license        TEXT,
  trade_license_photo  TEXT,
  fb_page_url          TEXT,
  website_url          TEXT,
  online_platforms     TEXT[]      DEFAULT '{}',
  online_proof_photo   TEXT,
  verification_code    VARCHAR(50),
  online_verified      BOOLEAN     DEFAULT false,
  online_verified_at   TIMESTAMPTZ,
  nid_verified         BOOLEAN     DEFAULT false,
  subscription_plan    VARCHAR(20) NOT NULL DEFAULT 'free'
                         CHECK (subscription_plan IN ('free','basic','premium')),
  subscription_expires TIMESTAMPTZ,
  is_active            BOOLEAN     NOT NULL DEFAULT true,
  is_blocked           BOOLEAN     NOT NULL DEFAULT false,
  blocked_reason       TEXT,
  currency             VARCHAR(10) DEFAULT '৳',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── STAFF ────────────────────────────────────────────────
CREATE TABLE staff (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id     UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(30) NOT NULL DEFAULT 'cashier'
                CHECK (role IN ('manager','cashier','stock_manager','viewer')),
  permissions JSONB       NOT NULL DEFAULT '{"pos":true,"inventory":false,"reports":false,"customers":true}',
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, user_id)
);

-- ─── CATEGORIES ───────────────────────────────────────────
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id    UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  icon       VARCHAR(20)  DEFAULT '📦',
  color      VARCHAR(20)  DEFAULT '#0F4C81',
  is_active  BOOLEAN      NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── PRODUCTS ─────────────────────────────────────────────
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id         UUID         NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  category_id     UUID         REFERENCES categories(id) ON DELETE SET NULL,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  barcode         VARCHAR(100),
  sku             VARCHAR(100),
  unit            VARCHAR(30)  DEFAULT 'পিস',
  cost_price      NUMERIC(12,2) NOT NULL DEFAULT 0,
  selling_price   NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock_quantity  INTEGER      NOT NULL DEFAULT 0,
  min_stock_alert INTEGER      NOT NULL DEFAULT 5,
  photos          TEXT[]       DEFAULT '{}',
  is_active       BOOLEAN      NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── CUSTOMERS ────────────────────────────────────────────
CREATE TABLE customers (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id        UUID         NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,
  phone          VARCHAR(20),
  address        TEXT,
  total_purchase NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_paid     NUMERIC(14,2) NOT NULL DEFAULT 0,
  due_amount     NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes          TEXT,
  is_active      BOOLEAN       NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── SUPPLIERS ────────────────────────────────────────────
CREATE TABLE suppliers (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id      UUID         NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  phone        VARCHAR(20),
  address      TEXT,
  total_due    NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes        TEXT,
  is_active    BOOLEAN       NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── SALES ────────────────────────────────────────────────
CREATE TABLE sales (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id        UUID          NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id    UUID          REFERENCES customers(id) ON DELETE SET NULL,
  sold_by        UUID          REFERENCES users(id),
  invoice_number VARCHAR(50)   NOT NULL,
  subtotal       NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount       NUMERIC(14,2) NOT NULL DEFAULT 0,
  total          NUMERIC(14,2) NOT NULL DEFAULT 0,
  paid_amount    NUMERIC(14,2) NOT NULL DEFAULT 0,
  due_amount     NUMERIC(14,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(30)   NOT NULL DEFAULT 'cash'
                   CHECK (payment_method IN ('cash','bkash','nagad','rocket','card','bank','due')),
  status         VARCHAR(20)   NOT NULL DEFAULT 'completed'
                   CHECK (status IN ('completed','partial','due','refunded')),
  notes          TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, invoice_number)
);

-- ─── SALE ITEMS ───────────────────────────────────────────
CREATE TABLE sale_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id      UUID          NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id   UUID          REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255)  NOT NULL,
  quantity     INTEGER       NOT NULL DEFAULT 1,
  unit_price   NUMERIC(12,2) NOT NULL,
  cost_price   NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal     NUMERIC(14,2) NOT NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── PURCHASES ────────────────────────────────────────────
CREATE TABLE purchases (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id        UUID          NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  supplier_id    UUID          REFERENCES suppliers(id) ON DELETE SET NULL,
  invoice_number VARCHAR(50),
  total          NUMERIC(14,2) NOT NULL DEFAULT 0,
  paid_amount    NUMERIC(14,2) NOT NULL DEFAULT 0,
  due_amount     NUMERIC(14,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(30)   DEFAULT 'cash',
  notes          TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── PURCHASE ITEMS ───────────────────────────────────────
CREATE TABLE purchase_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id  UUID          NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id   UUID          REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255)  NOT NULL,
  quantity     INTEGER       NOT NULL DEFAULT 1,
  unit_price   NUMERIC(12,2) NOT NULL,
  subtotal     NUMERIC(14,2) NOT NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── EXPENSES ─────────────────────────────────────────────
CREATE TABLE expenses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id     UUID          NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  category    VARCHAR(100)  NOT NULL DEFAULT 'অন্যান্য',
  description TEXT          NOT NULL,
  amount      NUMERIC(12,2) NOT NULL,
  date        DATE          NOT NULL DEFAULT CURRENT_DATE,
  created_by  UUID          REFERENCES users(id),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── PAYMENTS ─────────────────────────────────────────────
CREATE TABLE payments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id      UUID          NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  type         VARCHAR(20)   NOT NULL CHECK (type IN ('income','expense')),
  category     VARCHAR(50)   NOT NULL,
  reference_id UUID,
  amount       NUMERIC(14,2) NOT NULL,
  method       VARCHAR(30)   DEFAULT 'cash',
  note         TEXT,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── OTP REQUESTS ─────────────────────────────────────────
CREATE TABLE otp_requests (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone      VARCHAR(20) NOT NULL UNIQUE,
  otp        VARCHAR(10) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ACTIVITY LOGS ────────────────────────────────────────
CREATE TABLE activity_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID         REFERENCES users(id) ON DELETE SET NULL,
  shop_id    UUID         REFERENCES shops(id) ON DELETE SET NULL,
  action     VARCHAR(100) NOT NULL,
  details    JSONB        DEFAULT '{}',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── NOTIFICATIONS ────────────────────────────────────────
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id    UUID         NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id    UUID         REFERENCES users(id) ON DELETE SET NULL,
  type       VARCHAR(50)  NOT NULL DEFAULT 'info',
  title      VARCHAR(255) NOT NULL,
  message    TEXT,
  is_read    BOOLEAN      NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── UPDATED_AT FUNCTION ──────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated     BEFORE UPDATE ON users     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_shops_updated     BEFORE UPDATE ON shops     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated  BEFORE UPDATE ON products  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_suppliers_updated BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sales_updated     BEFORE UPDATE ON sales     FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── AUTO STOCK DECREASE ON SALE ──────────────────────────
CREATE OR REPLACE FUNCTION fn_decrease_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE products
    SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity)
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decrease_stock
AFTER INSERT ON sale_items
FOR EACH ROW EXECUTE FUNCTION fn_decrease_stock();

-- ─── AUTO STOCK INCREASE ON PURCHASE ──────────────────────
CREATE OR REPLACE FUNCTION fn_increase_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE products
    SET stock_quantity = stock_quantity + NEW.quantity,
        cost_price = NEW.unit_price
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increase_stock
AFTER INSERT ON purchase_items
FOR EACH ROW EXECUTE FUNCTION fn_increase_stock();

-- ─── AUTO UPDATE CUSTOMER STATS ON SALE ───────────────────
CREATE OR REPLACE FUNCTION fn_update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    UPDATE customers SET
      total_purchase = total_purchase + NEW.total,
      total_paid     = total_paid + NEW.paid_amount,
      due_amount     = due_amount + NEW.due_amount
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customer_stats
AFTER INSERT ON sales
FOR EACH ROW EXECUTE FUNCTION fn_update_customer_stats();

-- ─── INDEXES ──────────────────────────────────────────────
CREATE INDEX idx_products_shop    ON products(shop_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_sales_shop       ON sales(shop_id);
CREATE INDEX idx_sales_customer   ON sales(customer_id);
CREATE INDEX idx_sales_date       ON sales(created_at DESC);
CREATE INDEX idx_customers_shop   ON customers(shop_id);
CREATE INDEX idx_notifs_shop      ON notifications(shop_id, is_read);

-- ─── DISABLE RLS (Service Role handles auth) ──────────────
ALTER TABLE users          DISABLE ROW LEVEL SECURITY;
ALTER TABLE shops          DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff          DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories     DISABLE ROW LEVEL SECURITY;
ALTER TABLE products       DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers      DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers      DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales          DISABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items     DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchases      DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses       DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments       DISABLE ROW LEVEL SECURITY;
ALTER TABLE otp_requests   DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs  DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  DISABLE ROW LEVEL SECURITY;

-- ✅ Schema complete!
