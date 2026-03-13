-- ============================================================
-- DIGIBOI v3 — Complete Database Schema
-- Run this once in Supabase SQL Editor
-- ============================================================

-- USERS (owners)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  owner_photo TEXT,
  nid_front TEXT,
  nid_back TEXT,
  country VARCHAR(10) DEFAULT 'BD',
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- OTP TABLE
CREATE TABLE IF NOT EXISTS otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(10) NOT NULL,
  purpose VARCHAR(30) DEFAULT 'register',
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SHOPS
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  biz_type VARCHAR(30) DEFAULT 'ফিজিক্যাল',
  trade_license TEXT,
  division VARCHAR(100),
  district VARCHAR(100),
  upazila VARCHAR(100),
  post_code VARCHAR(20),
  address TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  plan VARCHAR(30) DEFAULT 'Free',
  status VARCHAR(20) DEFAULT 'pending',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- STAFF
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'staff',
  permissions JSONB DEFAULT '{"pos":true,"inventory":false,"reports":false}',
  salary DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT '#FF5722',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default categories
-- (Will be inserted on shop creation)

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  barcode VARCHAR(100),
  sell_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  buy_price DECIMAL(12,2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  low_stock_alert INTEGER DEFAULT 5,
  unit VARCHAR(20) DEFAULT 'পিস',
  qr_code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  due_amount DECIMAL(12,2) DEFAULT 0,
  total_purchase DECIMAL(12,2) DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  customer_type VARCHAR(20) DEFAULT 'সাধারণ',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_shop ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- SALES
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  invoice_id VARCHAR(40) UNIQUE NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  discount_pct DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid DECIMAL(12,2) DEFAULT 0,
  due DECIMAL(12,2) DEFAULT 0,
  payment_method VARCHAR(30) DEFAULT 'নগদ',
  notes TEXT,
  status VARCHAR(20) DEFAULT 'paid',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_shop ON sales(shop_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_id);

-- SALE ITEMS
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);

-- SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  total_purchase DECIMAL(12,2) DEFAULT 0,
  due_amount DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- PURCHASES (stock in from supplier)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  invoice_id VARCHAR(40) UNIQUE NOT NULL,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid DECIMAL(12,2) DEFAULT 0,
  due DECIMAL(12,2) DEFAULT 0,
  payment_method VARCHAR(30) DEFAULT 'নগদ',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- PURCHASE ITEMS
CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0
);

-- EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  category VARCHAR(100) DEFAULT 'অন্যান্য',
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- DUE PAYMENTS (collect due from customer)
CREATE TABLE IF NOT EXISTS due_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(30) DEFAULT 'নগদ',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  type VARCHAR(30) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- HELPFUL VIEWS
-- ============================================================

CREATE OR REPLACE VIEW v_dashboard AS
SELECT
  s.id AS shop_id,
  COALESCE(SUM(CASE WHEN DATE(sl.created_at) = CURRENT_DATE THEN sl.total END), 0) AS today_sales,
  COALESCE(SUM(CASE WHEN DATE(sl.created_at) = CURRENT_DATE THEN sl.total - sl.paid END), 0) AS today_due,
  COALESCE(COUNT(CASE WHEN DATE(sl.created_at) = CURRENT_DATE THEN 1 END), 0) AS today_orders,
  COALESCE(SUM(CASE WHEN DATE_TRUNC('month', sl.created_at) = DATE_TRUNC('month', CURRENT_DATE) THEN sl.total END), 0) AS month_sales
FROM shops s
LEFT JOIN sales sl ON sl.shop_id = s.id
GROUP BY s.id;

-- ============================================================
-- RLS POLICIES (DISABLE for service role, enable for anon)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE due_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;

-- Service role bypasses all RLS — API routes use service role key

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sales_shop_date ON sales(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(shop_id, is_active);
CREATE INDEX IF NOT EXISTS idx_customers_due ON customers(shop_id, due_amount);
