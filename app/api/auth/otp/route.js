export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { normalizePhone, validateBDPhone } from "@/lib/helpers";

export async function POST(req) {
  try {
    const { phone, purpose = "register" } = await req.json();
    const normalized = normalizePhone(phone);
    if (!normalized || !validateBDPhone(phone)) {
      return NextResponse.json({ success: false, error: "সঠিক বাংলাদেশি নম্বর দিন" }, { status: 400 });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Delete old OTPs for this phone+purpose
    await supabaseAdmin.from("otps").delete().eq("phone", normalized).eq("purpose", purpose);

    const { error } = await supabaseAdmin.from("otps").insert({
      phone: normalized, code, purpose, expires_at: expiresAt
    });
    if (error) throw error;

    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json({
      success: true,
      message: "OTP পাঠানো হয়েছে",
      ...(isDev && { dev_code: code })
    });
  } catch (err) {
    console.error("OTP error:", err);
    return NextResponse.json({ success: false, error: "OTP পাঠানো যায়নি: " + (err.message || "") }, { status: 500 });
  }
}
