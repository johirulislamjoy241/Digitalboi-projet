-- ============================================================
-- DIGIBOI v3 — সম্পূর্ণ Supabase ডাটাবেজ স্কিমা
-- Supabase SQL Editor-এ পুরোটা একসাথে রান করুন
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- DROP TABLES (fresh install)
-- ============================================================
drop table if exists public.notifications   cascade;
drop table if exists public.due_payments    cascade;
drop table if exists public.payments        cascade;
drop table if exists public.purchase_items  cascade;
drop table if exists public.purchases       cascade;
drop table if exists public.sale_items      cascade;
drop table if exists public.sales           cascade;
drop table if exists public.expenses        cascade;
drop table if exists public.products        cascade;
drop table if exists public.categories      cascade;
drop table if exists public.customers       cascade;
drop table if exists public.suppliers       cascade;
drop table if exists public.staff           cascade;
drop table if exists public.shops           cascade;
drop table if exists public.otps            cascade;
drop table if exists public.users           cascade;

-- ============================================================
-- 1. USERS
-- ============================================================
create table public.users (
  id            uuid primary key default gen_random_uuid(),
  phone         text unique not null,
  email         text unique,
  name          text,
  password_hash text,
  role          text not null default 'owner'
                  check (role in ('owner','manager','cashier','staff')),
  is_verified   boolean not null default false,
  is_active     boolean not null default true,
  is_blocked    boolean not null default false,
  profile_photo text,
  last_login    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- 2. OTPS — code + purpose columns (matches routes exactly)
-- ============================================================
create table public.otps (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null,
  code        text not null,
  purpose     text not null default 'register'
                check (purpose in ('register','login','reset')),
  used        boolean not null default false,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
create index otps_phone_idx on public.otps(phone);
create index otps_phone_purpose_idx on public.otps(phone, purpose);

-- ============================================================
-- 3. SHOPS
-- ============================================================
create table public.shops (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.users(id) on delete cascade,
  name        text not null,
  phone       text,
  email       text,
  biz_type    text default 'ফিজিক্যাল',
  division    text,
  district    text,
  upazila     text,
  post_code   text,
  address     text,
  latitude    double precision,
  longitude   double precision,
  logo_url    text,
  plan        text not null default 'Free'
                check (plan in ('Free','Basic','Premium')),
  status      text not null default 'active'
                check (status in ('pending','active','blocked')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index shops_owner_idx on public.shops(owner_id);

-- ============================================================
-- 4. STAFF
-- ============================================================
create table public.staff (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references public.shops(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  role        text not null default 'cashier'
                check (role in ('manager','cashier','staff')),
  permissions jsonb not null default '{"pos":true,"inventory":false,"reports":false,"customers":true,"expenses":false}'::jsonb,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique(shop_id, user_id)
);

-- ============================================================
-- 5. CATEGORIES
-- ============================================================
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references public.shops(id) on delete cascade,
  name        text not null,
  color       text not null default '#FF5722',
  created_at  timestamptz not null default now()
);
create index categories_shop_idx on public.categories(shop_id);

-- ============================================================
-- 6. PRODUCTS
-- ============================================================
create table public.products (
  id              uuid primary key default gen_random_uuid(),
  shop_id         uuid not null references public.shops(id) on delete cascade,
  category_id     uuid references public.categories(id) on delete set null,
  name            text not null,
  brand           text,
  barcode         text,
  qr_code         text,
  sell_price      numeric(12,2) not null default 0,
  buy_price       numeric(12,2) not null default 0,
  stock           numeric(12,3) not null default 0,
  low_stock_alert numeric(12,3) not null default 5,
  unit            text not null default 'পিস',
  image_url       text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index products_shop_idx on public.products(shop_id);
create index products_barcode_idx on public.products(barcode);

-- ============================================================
-- 7. CUSTOMERS
-- ============================================================
create table public.customers (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references public.shops(id) on delete cascade,
  name           text not null,
  phone          text,
  address        text,
  due_amount     numeric(12,2) not null default 0,
  total_purchase numeric(12,2) not null default 0,
  loyalty_points integer not null default 0,
  customer_type  text not null default 'Regular'
                   check (customer_type in ('Regular','VIP')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index customers_shop_idx on public.customers(shop_id);

-- ============================================================
-- 8. SUPPLIERS
-- ============================================================
create table public.suppliers (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references public.shops(id) on delete cascade,
  name           text not null,
  phone          text,
  email          text,
  address        text,
  due_amount     numeric(12,2) not null default 0,
  total_purchase numeric(12,2) not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index suppliers_shop_idx on public.suppliers(shop_id);

-- ============================================================
-- 9. SALES
-- ============================================================
create table public.sales (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references public.shops(id) on delete cascade,
  customer_id    uuid references public.customers(id) on delete set null,
  invoice_id     text not null unique,
  subtotal       numeric(12,2) not null default 0,
  discount       numeric(12,2) not null default 0,
  discount_pct   numeric(5,2)  not null default 0,
  total          numeric(12,2) not null default 0,
  paid           numeric(12,2) not null default 0,
  due            numeric(12,2) not null default 0,
  payment_method text not null default 'নগদ',
  notes          text,
  status         text not null default 'paid'
                   check (status in ('paid','due','partial')),
  created_at     timestamptz not null default now()
);
create index sales_shop_idx     on public.sales(shop_id);
create index sales_customer_idx on public.sales(customer_id);
create index sales_created_idx  on public.sales(created_at desc);

-- ============================================================
-- 10. SALE_ITEMS
-- ============================================================
create table public.sale_items (
  id           uuid primary key default gen_random_uuid(),
  sale_id      uuid not null references public.sales(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity     numeric(12,3) not null default 1,
  unit_price   numeric(12,2) not null default 0,
  subtotal     numeric(12,2) not null default 0
);
create index sale_items_sale_idx on public.sale_items(sale_id);

-- ============================================================
-- 11. PURCHASES
-- ============================================================
create table public.purchases (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references public.shops(id) on delete cascade,
  supplier_id    uuid references public.suppliers(id) on delete set null,
  invoice_id     text not null,
  total          numeric(12,2) not null default 0,
  paid           numeric(12,2) not null default 0,
  due            numeric(12,2) not null default 0,
  payment_method text not null default 'নগদ',
  notes          text,
  created_at     timestamptz not null default now()
);
create index purchases_shop_idx on public.purchases(shop_id);

-- ============================================================
-- 12. PURCHASE_ITEMS
-- ============================================================
create table public.purchase_items (
  id           uuid primary key default gen_random_uuid(),
  purchase_id  uuid not null references public.purchases(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity     numeric(12,3) not null default 1,
  unit_cost    numeric(12,2) not null default 0,
  subtotal     numeric(12,2) not null default 0
);
create index purchase_items_purchase_idx on public.purchase_items(purchase_id);

-- ============================================================
-- 13. EXPENSES
-- ============================================================
create table public.expenses (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid not null references public.shops(id) on delete cascade,
  category   text not null default 'অন্যান্য',
  amount     numeric(12,2) not null default 0,
  note       text,
  created_at timestamptz not null default now()
);
create index expenses_shop_idx on public.expenses(shop_id);

-- ============================================================
-- 14. DUE_PAYMENTS
-- ============================================================
create table public.due_payments (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references public.shops(id) on delete cascade,
  customer_id    uuid references public.customers(id) on delete set null,
  amount         numeric(12,2) not null default 0,
  payment_method text not null default 'নগদ',
  note           text,
  created_at     timestamptz not null default now()
);
create index due_payments_shop_idx     on public.due_payments(shop_id);
create index due_payments_customer_idx on public.due_payments(customer_id);

-- ============================================================
-- 15. PAYMENTS (general ledger)
-- ============================================================
create table public.payments (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references public.shops(id) on delete cascade,
  category       text not null,
  entity_id      uuid,
  amount         numeric(12,2) not null default 0,
  payment_method text not null default 'নগদ',
  notes          text,
  created_at     timestamptz not null default now()
);
create index payments_shop_idx on public.payments(shop_id);

-- ============================================================
-- 16. NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid references public.shops(id) on delete cascade,
  user_id    uuid references public.users(id) on delete cascade,
  type       text not null default 'info'
               check (type in ('info','warning','success','error')),
  title      text not null,
  message    text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_shop_idx on public.notifications(shop_id);
create index notifications_user_idx on public.notifications(user_id);

-- ============================================================
-- AUTO updated_at TRIGGER
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_users_updated_at     before update on public.users     for each row execute function public.set_updated_at();
create trigger trg_shops_updated_at     before update on public.shops     for each row execute function public.set_updated_at();
create trigger trg_products_updated_at  before update on public.products  for each row execute function public.set_updated_at();
create trigger trg_customers_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger trg_suppliers_updated_at before update on public.suppliers for each row execute function public.set_updated_at();

-- ============================================================
-- RLS — চালু করুন (service_role key সব bypass করে)
-- ============================================================
alter table public.users           enable row level security;
alter table public.otps            enable row level security;
alter table public.shops           enable row level security;
alter table public.staff           enable row level security;
alter table public.categories      enable row level security;
alter table public.products        enable row level security;
alter table public.customers       enable row level security;
alter table public.suppliers       enable row level security;
alter table public.sales           enable row level security;
alter table public.sale_items      enable row level security;
alter table public.purchases       enable row level security;
alter table public.purchase_items  enable row level security;
alter table public.expenses        enable row level security;
alter table public.due_payments    enable row level security;
alter table public.payments        enable row level security;
alter table public.notifications   enable row level security;

-- ============================================================
-- ✅ সম্পূর্ণ! এখন .env.local ফাইল তৈরি করুন:
--
-- NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
-- NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
-- SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
-- JWT_SECRET=digiboi-super-secret-2025
-- NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name (optional)
-- CLOUDINARY_API_KEY=your_api_key (optional)
-- CLOUDINARY_API_SECRET=your_api_secret (optional)
-- ============================================================
