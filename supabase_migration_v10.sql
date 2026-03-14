-- ============================================================
-- DIGIBOI v10 — Migration SQL
-- Supabase SQL Editor এ একবার Run করুন
-- ============================================================

-- shops table এ নতুন columns যোগ করুন
ALTER TABLE shops ADD COLUMN IF NOT EXISTS email       VARCHAR(255);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS division    VARCHAR(100);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS upazila     VARCHAR(100);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS thana       VARCHAR(100);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS post_code   VARCHAR(20);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS latitude    DECIMAL(10,7);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS longitude   DECIMAL(10,7);

-- users table
ALTER TABLE users  ADD COLUMN IF NOT EXISTS country    VARCHAR(10) DEFAULT 'BD';

-- otp_requests: phone UNIQUE constraint নিশ্চিত করুন
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'otp_requests_phone_key'
  ) THEN
    ALTER TABLE otp_requests ADD CONSTRAINT otp_requests_phone_key UNIQUE (phone);
  END IF;
END $$;

-- sales এ index যোগ করুন (performance)
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(shop_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_otp_phone     ON otp_requests(phone);

-- ✅ Migration complete! এখন Next.js app deploy করুন।
