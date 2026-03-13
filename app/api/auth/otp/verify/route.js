import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { normalizePhone } from "@/lib/helpers";

export async function POST(req) {
  try {
    const { phone, code, purpose = "register" } = await req.json();
    const normalized = normalizePhone(phone);
    if (!normalized) return NextResponse.json({ success: false, error: "সঠিক নম্বর নয়" }, { status: 400 });

    const { data: otp } = await supabaseAdmin
      .from("otps")
      .select("id")
      .eq("phone", normalized)
      .eq("code", code)
      .eq("purpose", purpose)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .single();

    if (!otp) return NextResponse.json({ success: false, error: "OTP সঠিক নয় বা মেয়াদ শেষ" }, { status: 400 });

    await supabaseAdmin.from("otps").update({ used: true }).eq("id", otp.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("OTP verify error:", err);
    return NextResponse.json({ success: false, error: "যাচাই ব্যর্থ" }, { status: 500 });
  }
}
