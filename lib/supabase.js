import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  || "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const svc  = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!url || !anon) {
  console.warn("⚠️  Supabase env vars missing. Add to .env.local:\n  NEXT_PUBLIC_SUPABASE_URL\n  NEXT_PUBLIC_SUPABASE_ANON_KEY\n  SUPABASE_SERVICE_ROLE_KEY");
}

// Browser client (RLS enforced)
export const supabase = createClient(url, anon);

// Server-side admin (bypasses RLS — server only)
export const supabaseAdmin = createClient(url, svc || anon, {
  auth: { autoRefreshToken: false, persistSession: false },
});
