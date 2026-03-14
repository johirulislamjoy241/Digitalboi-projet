-- ============================================================
-- DIGIBOI v4 Upgrade SQL
-- Supabase SQL Editor এ রান করুন
-- ============================================================

-- 1. customers table এ নতুন column যোগ
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS alt_phone text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS nid text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS dob text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS gender text default 'পুরুষ';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS reference text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS notes text;

-- 2. products table এ description ও supplier_id যোগ
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS supplier_id uuid references public.suppliers(id) on delete set null;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS expiry_date date;

-- 3. users table এ recovery_code যোগ
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS recovery_code text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS recovery_code_set_at timestamptz;

-- 4. expenses table এ date column ও delete
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS expense_date date default current_date;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS is_deleted boolean default false;

-- 5. shops table এ biz_category যোগ
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS biz_category text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS social_link text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS trade_license text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS nid text;

-- 6. notifications এ sender_id
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS sender_id uuid references public.users(id) on delete set null;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link text;

-- 7. due_payments table (না থাকলে তৈরি করুন)
CREATE TABLE IF NOT EXISTS public.due_payments (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references public.shops(id) on delete cascade,
  customer_id    uuid references public.customers(id) on delete set null,
  amount         numeric(12,2) not null,
  payment_method text not null default 'নগদ',
  note           text,
  created_at     timestamptz not null default now()
);

-- 8. notifications table (না থাকলে তৈরি করুন)
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid references public.shops(id) on delete cascade,
  user_id    uuid references public.users(id) on delete cascade,
  sender_id  uuid references public.users(id) on delete set null,
  type       text not null default 'info',
  title      text not null,
  message    text,
  link       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

