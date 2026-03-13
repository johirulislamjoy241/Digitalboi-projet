# Digiboi v3 — Bangladesh POS & Shop Management SaaS

একটি সম্পূর্ণ বাংলাদেশি POS ও দোকান ব্যবস্থাপনা সিস্টেম।

## টেক স্ট্যাক

- **Frontend:** Next.js 14 (App Router, SPA mode)
- **Database:** Supabase (PostgreSQL)
- **Auth:** JWT (bcryptjs + jsonwebtoken)
- **State:** Zustand
- **Image:** Cloudinary (optional)
- **Font:** Hind Siliguri (Bengali)

## চালু করার নির্দেশনা

### ১. Supabase সেটআপ

1. [supabase.com](https://supabase.com) → নতুন প্রজেক্ট তৈরি করুন
2. SQL Editor → `digiboi_v3_database.sql` পুরোটা paste করে **Run** করুন
3. Settings → API → keys কপি করুন

### ২. প্রজেক্ট সেটআপ

```bash
# ZIP আনজিপ করুন
unzip digiboi-v3-final.zip -d digiboi-v3
cd digiboi-v3

# Environment variables সেট করুন
cp .env.local.example .env.local
# .env.local ফাইলে আপনার Supabase keys বসান

# Dependencies ইন্সটল করুন
npm install

# Development server চালু করুন
npm run dev
```

### ৩. .env.local কনফিগ

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=digiboi-super-secret-2025
```

## ফিচার তালিকা

| ফিচার | বিবরণ |
|-------|--------|
| 🔐 Auth | পাসওয়ার্ড দিয়ে লগইন, রেজিস্ট্রেশন, পাসওয়ার্ড রিসেট |
| 📊 Dashboard | আজকের বিক্রয়, মাসিক চার্ট, লো স্টক সতর্কতা |
| 🛒 POS | বারকোড স্ক্যান, কাস্টমার নির্বাচন, রসিদ প্রিন্ট |
| 📦 Inventory | পণ্য যোগ/সম্পাদনা, QR কোড, স্টক ট্র্যাকিং |
| 👥 Customers | বাকি কালেকশন, VIP অটো আপগ্রেড, লয়্যালটি পয়েন্ট |
| 💸 Expenses | খরচ ট্র্যাকিং, ক্যাটাগরি অনুযায়ী |
| 🚚 Suppliers | সরবরাহকারী ব্যবস্থাপনা |
| 📊 Reports | মাসিক বিক্রয় চার্ট, বিশ্লেষণ |
| 🤖 AI Tools | স্টক প্রেডিকশন, ফোরকাস্ট |
| ⚙️ Settings | দোকান ও প্রোফাইল সম্পাদনা |
| 🏢 Admin | সব দোকান পরিচালনা |

## ডিরেক্টরি কাঠামো

```
app/
  api/          — সব API routes
  auth/         — login, register, forgot-password
  page.js       — SPA shell (main entry)
  dashboard/    — ড্যাশবোর্ড
  pos/          — POS বিক্রয়
  inventory/    — ইনভেন্টরি
  customers/    — কাস্টমার
  more/         — রিপোর্ট, খরচ, সাপ্লাইয়ার, AI, সেটিংস
  profile/      — প্রোফাইল সম্পাদনা
lib/
  design.js     — Design tokens + BD locations
  ui.js         — Reusable UI components
  icons.js      — SVG icons
  helpers.js    — Utility functions
  auth.js       — JWT auth helpers
  supabase.js   — Supabase clients
  store.js      — Zustand stores
digiboi_v3_database.sql — সম্পূর্ণ DB schema
```
