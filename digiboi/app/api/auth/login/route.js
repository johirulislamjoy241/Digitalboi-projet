export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { signToken } from "@/lib/jwt";
import { normalizePhone } from "@/lib/helpers";

async function getShop(userId) {
  const { data } = await supabaseAdmin.from("shops").select("id,name").eq("owner_id", userId).eq("is_active", true).single();
  return data;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { phone, code, identifier, password } = body;

    // ── OTP LOGIN ──
    if (phone && code) {
      const normalized = normalizePhone(phone);
      if (!normalized) return NextResponse.json({ success: false, error: "সঠিক নম্বর নয়" }, { status: 400 });

      const { data: otpRow } = await supabaseAdmin.from("otps")
        .select("id").eq("phone", normalized).eq("code", code)
        .eq("purpose", "login").eq("used", false)
        .gte("expires_at", new Date().toISOString()).single();
      if (!otpRow) return NextResponse.json({ success: false, error: "OTP সঠিক নয় বা মেয়াদ শেষ" }, { status: 401 });

      await supabaseAdmin.from("otps").update({ used: true }).eq("id", otpRow.id);

      const { data: user } = await supabaseAdmin.from("users")
        .select("id,name,phone,email,is_active").eq("phone", normalized).single();
      if (!user) return NextResponse.json({ success: false, error: "অ্যাকাউন্ট পাওয়া যায়নি" }, { status: 404 });
      if (!user.is_active) return NextResponse.json({ success: false, error: "অ্যাকাউন্ট নিষ্ক্রিয়" }, { status: 403 });

      const shop = await getShop(user.id);
      const token = signToken({ userId: user.id, shopId: shop?.id, role: "owner" });
      // Update last login
      await supabaseAdmin.from("users").update({ last_login: new Date().toISOString() }).eq("id", user.id);
      return NextResponse.json({ success: true, token, user: { id: user.id, name: user.name, phone: user.phone, email: user.email, shopId: shop?.id, shopName: shop?.name, role: "owner" } });
    }

    // ── PASSWORD LOGIN ──
    if (identifier && password) {
      const normalized = normalizePhone(identifier);
      let user = null;

      if (normalized) {
        const { data } = await supabaseAdmin.from("users").select("id,name,phone,email,password_hash,is_active").eq("phone", normalized).single();
        user = data;
      } else {
        const { data } = await supabaseAdmin.from("users").select("id,name,phone,email,password_hash,is_active").eq("email", identifier).single();
        user = data;
      }

      if (!user) return NextResponse.json({ success: false, error: "ইউজার পাওয়া যায়নি" }, { status: 404 });
      if (!user.is_active) return NextResponse.json({ success: false, error: "অ্যাকাউন্ট নিষ্ক্রিয়" }, { status: 403 });
      if (!user.password_hash) return NextResponse.json({ success: false, error: "পাসওয়ার্ড সেট করা নেই, OTP দিয়ে লগইন করুন" }, { status: 400 });

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return NextResponse.json({ success: false, error: "পাসওয়ার্ড সঠিক নয়" }, { status: 401 });

      const shop = await getShop(user.id);
      const token = signToken({ userId: user.id, shopId: shop?.id, role: "owner" });
      await supabaseAdmin.from("users").update({ last_login: new Date().toISOString() }).eq("id", user.id);
      return NextResponse.json({ success: true, token, user: { id: user.id, name: user.name, phone: user.phone, email: user.email, shopId: shop?.id, shopName: shop?.name, role: "owner" } });
    }

    return NextResponse.json({ success: false, error: "লগইন তথ্য অসম্পূর্ণ" }, { status: 400 });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ success: false, error: "লগইন ব্যর্থ: " + (err.message || "") }, { status: 500 });
  }
}
