export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { normalizePhone, validateBDPhone } from "@/lib/helpers";

// Step 1: Verify phone + shop name (secret) → return masked info
// Step 2: Set new password
export async function POST(req) {
  try {
    const body = await req.json();
    const { step, phone, shopName, newPassword } = body;

    if (!phone?.trim()) return NextResponse.json({ success:false, error:"ফোন নম্বর দিন" }, { status:400 });
    if (!validateBDPhone(phone)) return NextResponse.json({ success:false, error:"সঠিক বাংলাদেশি নম্বর দিন" }, { status:400 });

    const normalized = normalizePhone(phone);

    // Find user
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id,name,is_active,is_blocked")
      .eq("phone", normalized)
      .maybeSingle();

    if (!user) return NextResponse.json({ success:false, error:"এই নম্বরে কোনো অ্যাকাউন্ট নেই" }, { status:404 });
    if (!user.is_active) return NextResponse.json({ success:false, error:"অ্যাকাউন্ট নিষ্ক্রিয়" }, { status:403 });
    if (user.is_blocked) return NextResponse.json({ success:false, error:"অ্যাকাউন্ট ব্লক করা আছে" }, { status:403 });

    // Find shop
    const { data: shop } = await supabaseAdmin
      .from("shops")
      .select("id,name")
      .eq("owner_id", user.id)
      .single();

    if (!shop) return NextResponse.json({ success:false, error:"দোকানের তথ্য পাওয়া যায়নি" }, { status:404 });

    // STEP 1: Verify — phone exists, return hint only
    if (step === 1 || !step) {
      const maskedName = user.name.length > 2
        ? user.name[0] + "*".repeat(user.name.length - 2) + user.name[user.name.length - 1]
        : user.name[0] + "*";
      return NextResponse.json({
        success: true,
        verified: true,
        hint: `অ্যাকাউন্ট পাওয়া গেছে। নিচের প্রশ্নের উত্তর দিন।`,
        maskedName,
        question: "আপনার দোকানের নাম কী?",
      });
    }

    // STEP 2: Verify shopName answer
    if (step === 2) {
      if (!shopName?.trim()) return NextResponse.json({ success:false, error:"দোকানের নাম দিন" }, { status:400 });
      const normalize = s => s.trim().toLowerCase().replace(/\s+/g, " ");
      if (normalize(shopName) !== normalize(shop.name)) {
        return NextResponse.json({ success:false, error:"দোকানের নাম মিলছে না। আবার চেষ্টা করুন।" }, { status:401 });
      }
      return NextResponse.json({ success:true, verified:true, message:"যাচাই সম্পন্ন। নতুন পাসওয়ার্ড দিন।" });
    }

    // STEP 3: Set new password (after verification)
    if (step === 3) {
      if (!shopName?.trim()) return NextResponse.json({ success:false, error:"যাচাই তথ্য নেই" }, { status:400 });
      const normalize = s => s.trim().toLowerCase().replace(/\s+/g, " ");
      if (normalize(shopName) !== normalize(shop.name)) {
        return NextResponse.json({ success:false, error:"অননুমোদিত অনুরোধ" }, { status:401 });
      }
      if (!newPassword || newPassword.length < 6) return NextResponse.json({ success:false, error:"কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন" }, { status:400 });

      const hash = await bcrypt.hash(newPassword, 12);
      const { error } = await supabaseAdmin.from("users").update({ password_hash: hash }).eq("id", user.id);
      if (error) throw error;

      return NextResponse.json({ success:true, message:"পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে! লগইন করুন।" });
    }

    return NextResponse.json({ success:false, error:"অবৈধ অনুরোধ" }, { status:400 });
  } catch(e) {
    console.error("Forgot password error:", e);
    return NextResponse.json({ success:false, error:"পাসওয়ার্ড পরিবর্তন ব্যর্থ: " + e.message }, { status:500 });
  }
}
