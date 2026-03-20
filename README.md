# 📦 Digiboi — Next.js + Supabase

> **Digiboi v2.0** — Original Blogger/Airtable template সম্পূর্ণ নতুনভাবে Next.js 14 + Supabase PostgreSQL দিয়ে তৈরি।  
> Developer: **MD. Rakibul Hasan Rony**

---

## 🚀 Setup (৫ মিনিটে চালু)

### ধাপ ১ — Supabase Project তৈরি

1. [supabase.com](https://supabase.com) → **New Project**
2. **SQL Editor** → `supabase/migrations/001_initial_schema.sql` ফাইলের সব content paste → **Run**
3. **Settings → API** থেকে copy করুন:

| Variable | কোথা থেকে পাবেন |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` `secret` key |

### ধাপ ২ — Environment Variables

```bash
cp .env.local.example .env.local
# .env.local ফাইল খুলে আপনার Supabase values দিন
```

### ধাপ ৩ — Install & Run

```bash
npm install
npm run dev
# Browser: http://localhost:3000
```

### ধাপ ৪ — প্রথমবার ব্যবহার

1. **Register** ট্যাবে ক্লিক করুন
2. **Step 1**: ব্যবসার তথ্য দিন
3. **Step 2**: মালিকের তথ্য দিন  
4. **Step 3**: Login phone + password সেট করুন
5. **Sign In** করুন ✅

---

## 🌐 Vercel Deploy

```bash
# Vercel CLI দিয়ে:
npx vercel

# অথবা GitHub-এ push করুন এবং Vercel Dashboard থেকে import করুন
# Environment variables Vercel Dashboard → Settings → Environment Variables-এ দিন
```

---

## 📁 Project Structure

```
digiboi-nextjs/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts        # POST — Phone+Password login
│   │   │   │   └── register/route.ts     # POST — 3-step registration
│   │   │   ├── inventory/
│   │   │   │   ├── route.ts              # GET (list), POST (add)
│   │   │   │   └── [id]/route.ts         # PATCH (edit), DELETE
│   │   │   ├── transactions/route.ts     # GET (history), POST (stock in/out)
│   │   │   ├── due-ledger/
│   │   │   │   ├── route.ts              # GET, POST
│   │   │   │   └── [id]/route.ts         # PATCH (payment), DELETE
│   │   │   └── buyers/
│   │   │       ├── route.ts              # GET, POST
│   │   │       └── [id]/route.ts         # PATCH, DELETE
│   │   ├── layout.tsx                    # Root layout + fonts + metadata
│   │   ├── page.tsx                      # Main SPA shell
│   │   ├── loading.tsx                   # Global loading UI
│   │   ├── error.tsx                     # Global error boundary
│   │   └── not-found.tsx                 # 404 page
│   ├── components/
│   │   ├── AuthScreen.tsx                # Login + 3-step Register form
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx               # Navigation sidebar
│   │   │   └── Topbar.tsx                # Top header bar
│   │   └── sections/
│   │       ├── Dashboard.tsx             # Stats + Charts overview
│   │       ├── Inventory.tsx             # Full CRUD product management
│   │       ├── Transactions.tsx          # Stock In / Stock Out
│   │       ├── TxHistory.tsx             # Full transaction log + CSV
│   │       ├── DueLedger.tsx             # Due ledger + buyer profiles
│   │       ├── Reports.tsx               # Business reports + charts
│   │       ├── Settings.tsx              # Theme, currency, settings
│   │       └── StaticSections.tsx        # Security, Help, Legal pages
│   ├── lib/
│   │   ├── auth-context.tsx              # Auth state (login/register/logout)
│   │   ├── app-store.tsx                 # Global app state
│   │   ├── toast-context.tsx             # Toast notifications
│   │   ├── api.ts                        # All API client functions
│   │   ├── utils.ts                      # Currency, date, helper functions
│   │   └── supabase/
│   │       ├── client.ts                 # Browser Supabase client
│   │       └── server.ts                 # Server Supabase + service role
│   ├── middleware.ts                     # Security headers
│   ├── styles/globals.css                # All CSS (Digiboi design system)
│   └── types/index.ts                    # TypeScript type definitions
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql        # Full DB schema (6 tables)
├── public/
│   └── manifest.json                     # PWA manifest
├── .env.local.example                    # Environment variables template
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## ✅ সকল Features

| Feature | Status | বিবরণ |
|---|---|---|
| Phone+Password Login | ✅ | Country code সহ |
| 3-Step Registration | ✅ | Business → Owner → Credentials |
| 30-day Auto Session | ✅ | localStorage encrypted session |
| NID Duplicate Check | ✅ | Registration-এ server-side check |
| Account Lock | ✅ | Client-side brute force protection |
| **Inventory CRUD** | ✅ | Add, Edit, Archive, Delete |
| Search + Sort + Filter | ✅ | Real-time search, multi-column sort |
| Pagination | ✅ | 10/25/50/100 per page |
| **Stock In** | ✅ | Quantity বাড়ানো + price update option |
| **Stock Out (Sale)** | ✅ | Auto profit/loss calculation |
| Loss Warning | ✅ | Sell below cost price সতর্কতা |
| Price Update on Restock | ✅ | নতুন buy/sell price সেট |
| Transaction History | ✅ | Full history, filter by type |
| CSV Export | ✅ | Inventory + Transactions |
| **Due Ledger (বাকি খাতা)** | ✅ | Pending/Partial/Paid/Overdue |
| Buyer Profiles | ✅ | Name, Phone, Email, Address |
| Payment Recording | ✅ | Partial/Full payment |
| Overdue Detection | ✅ | Auto due date comparison |
| **Dashboard Charts** | ✅ | Bar, Pie, Line charts (Recharts) |
| **Reports** | ✅ | Category-wise stock/value/profit |
| Dark / Light Theme | ✅ | localStorage-এ persist |
| Multi-currency | ✅ | BDT, USD, EUR, GBP, INR, SAR, AED |
| Low Stock Threshold | ✅ | Configurable limit |
| Mobile Responsive | ✅ | Sidebar slide-out on mobile |
| Security Headers | ✅ | middleware.ts দিয়ে |
| Error Boundary | ✅ | error.tsx |
| 404 Page | ✅ | not-found.tsx |
| PWA Ready | ✅ | manifest.json |
| Privacy Policy | ✅ | বাংলায় |
| Disclaimer | ✅ | বাংলায় |
| Terms of Service | ✅ | বাংলায় |

---

## 🗄️ Database Tables (Supabase)

| Table | বিবরণ |
|---|---|
| `users` | Login credentials (phone + password) |
| `registrations` | Full business & owner profile |
| `inventory` | Product catalog |
| `transactions` | Stock in/out/price history |
| `due_ledger` | Due sale records |
| `buyers` | Buyer profiles |

---

## 🔧 Environment Variables

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Custom phone+password (Supabase table) |
| Charts | Recharts |
| Icons | Font Awesome 6 |
| Fonts | Outfit + JetBrains Mono |
| Styling | Custom CSS Variables + Tailwind CSS |
| State | React Context (no Redux needed) |
| Deployment | Vercel (recommended) |

---

## ❓ সমস্যা হলে

1. **"No account found"** → Registration করুন আগে
2. **API error** → `.env.local` এ Supabase keys চেক করুন
3. **Tables not found** → `001_initial_schema.sql` আবার run করুন
4. **Build error** → `npm install` আবার চালান

**Contact**: [facebook.com/DigiboiApp](https://facebook.com/DigiboiApp)
