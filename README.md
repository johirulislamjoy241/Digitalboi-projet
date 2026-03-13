# Digiboi v3 — Bangladesh POS & Shop Management SaaS

## 🚀 Setup

### 1. Supabase Database
Supabase SQL Editor-এ `supabase_v3.sql` রান করুন।

### 2. Environment Variables
`.env.local.example` কপি করে `.env.local` বানান এবং আপনার Supabase credentials দিন।

### 3. Install & Run
```bash
npm install
npm run dev
```

## 📱 Features
- 5-Step Registration (Phone OTP, Owner, NID, Business, Password)
- Login (Phone OTP + Password)
- Dashboard (Real-time stats, chart, low stock alert)
- POS (Barcode scan, cart, discount, payment methods, receipt)
- Inventory (Add/Edit/Delete products, QR code, low stock)
- Customers (Add, due collection, VIP system, loyalty points)
- Reports (Monthly chart, download)
- AI Tools (Smart analysis)
- Loyalty Program
- Admin Panel (All shops management)

## 🎨 Design
- Brand color: #FF5722 (Orange)
- Font: Hind Siliguri (Bengali)
- Mobile-first, max-width: 430px

## 🛠️ Tech Stack
- Next.js 15 (App Router)
- Supabase (PostgreSQL)
- JWT Authentication
- bcryptjs (Password hashing)
- Inline SVG icons (no external deps)
