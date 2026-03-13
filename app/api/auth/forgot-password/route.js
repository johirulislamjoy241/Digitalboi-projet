export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { normalizePhone, validateBDPhone } from "@/lib/helpers";

export async function POST(req) {
  try {
    const { phone, newPassword } = await req.json();
    if (!phone?.trim()) return NextResponse.json({ success:false, error:"ফোন নম্বর দিন" }, { status:400 });
    if (!newPassword || newPassword.length < 6) return NextResponse.json({ success:false, error:"কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন" }, { status:400 });

    const normalized = normalizePhone(phone);
    if (!validateBDPhone(phone)) return NextResponse.json({ success:false, error:"সঠিক বাংলাদেশি নম্বর দিন" }, { status:400 });

    const { data: user } = await supabaseAdmin.from("users")
      .select("id,is_active,is_blocked").eq("phone", normalized).maybeSingle();

    if (!user) return NextResponse.json({ success:false, error:"এই নম্বরে কোনো অ্যাকাউন্ট নেই" }, { status:404 });
    if (!user.is_active) return NextResponse.json({ success:false, error:"অ্যাকাউন্ট নিষ্ক্রিয়" }, { status:403 });
    if (user.is_blocked) return NextResponse.json({ success:false, error:"অ্যাকাউন্ট ব্লক করা হয়েছে" }, { status:403 });

    const hash = await bcrypt.hash(newPassword, 12);
    const { error } = await supabaseAdmin.from("users").update({ password_hash: hash }).eq("id", user.id);
    if (error) throw error;

    return NextResponse.json({ success:true, message:"পাসওয়ার্ড পরিবর্তন হয়েছে" });
  } catch(e) {
    console.error("Forgot password error:", e);
    return NextResponse.json({ success:false, error:"পাসওয়ার্ড পরিবর্তন ব্যর্থ: " + e.message }, { status:500 });
  }
}
