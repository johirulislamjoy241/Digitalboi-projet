-- ============================================================
-- Digiboi v11 Migration — Extra fields
-- Run this in Supabase SQL Editor
-- ============================================================

-- Products: description column
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS description text;

-- Shops: extra info columns
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS biz_category  text,
  ADD COLUMN IF NOT EXISTS website       text,
  ADD COLUMN IF NOT EXISTS social_link   text,
  ADD COLUMN IF NOT EXISTS trade_license text;

-- Users: extra personal info
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS nid        text,
  ADD COLUMN IF NOT EXISTS dob        text,
  ADD COLUMN IF NOT EXISTS gender     text DEFAULT 'পুরুষ';

-- Customers: biodata columns
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS alt_phone  text,
  ADD COLUMN IF NOT EXISTS email      text,
  ADD COLUMN IF NOT EXISTS nid        text,
  ADD COLUMN IF NOT EXISTS dob        text,
  ADD COLUMN IF NOT EXISTS gender     text DEFAULT 'পুরুষ',
  ADD COLUMN IF NOT EXISTS reference  text,
  ADD COLUMN IF NOT EXISTS notes      text;

-- ============================================================
-- done
-- ============================================================
