export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { normalizePhone, validateBDPhone } from "@/lib/helpers";

export async function POST(req) {
  try {
    const body = await req.json();
    const { step, phone, recoveryCode, newPassword } = body;

    if (!phone?.trim()) return NextResponse.json({success:false,error:"ফোন নম্বর দিন"},{status:400});
    if (!validateBDPhone(phone)) return NextResponse.json({success:false,error:"সঠিক বাংলাদেশি নম্বর দিন"},{status:400});
    const normalized = normalizePhone(phone);

    const { data:user } = await supabaseAdmin.from("users")
      .select("id,name,is_active,is_blocked,recovery_code").eq("phone",normalized).maybeSingle();

    if (!user)          return NextResponse.json({success:false,error:"এই নম্বরে কোনো অ্যাকাউন্ট নেই"},{status:404});
    if (!user.is_active)return NextResponse.json({success:false,error:"অ্যাকাউন্ট নিষ্ক্রিয়"},{status:403});
    if (user.is_blocked)return NextResponse.json({success:false,error:"অ্যাকাউন্ট ব্লক"},{status:403});
    if (!user.recovery_code) return NextResponse.json({success:false,error:"এই অ্যাকাউন্টে রিকভারি কোড সেট নেই। সরাসরি সাপোর্টে যোগাযোগ করুন।"},{status:400});

    // Step 1: phone check only — return masked name
    if (!step || step===1) {
      const maskedName = user.name
        ? user.name.length>2
          ? user.name[0]+"*".repeat(user.name.length-2)+user.name[user.name.length-1]
          : user.name[0]+"*"
        : "***";
      return NextResponse.json({success:true, maskedName, hasRecovery:true});
    }

    // Step 3: verify recovery code + set new password
    if (step===3) {
      // Validate inputs
      if (!recoveryCode || recoveryCode.length!==6 || !/^\d{6}$/.test(recoveryCode))
        return NextResponse.json({success:false,error:"৬ সংখ্যার রিকভারি কোড দিন"},{status:400});
      if (!newPassword || newPassword.length<6)
        return NextResponse.json({success:false,error:"কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন"},{status:400});

      // Verify recovery code against hashed value
      const isValid = await bcrypt.compare(recoveryCode, user.recovery_code);
      if (!isValid)
        return NextResponse.json({success:false,error:"রিকভারি কোড সঠিক নয়। আবার চেষ্টা করুন।"},{status:401});

      // Set new password
      const hash = await bcrypt.hash(newPassword, 12);
      const { error:updateErr } = await supabaseAdmin.from("users")
        .update({ password_hash:hash }).eq("id",user.id);
      if (updateErr) throw updateErr;

      return NextResponse.json({success:true, message:"পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!"});
    }

    return NextResponse.json({success:false,error:"অবৈধ অনুরোধ"},{status:400});
  } catch(e) {
    console.error("Forgot password error:", e);
    return NextResponse.json({success:false,error:"পাসওয়ার্ড পরিবর্তন ব্যর্থ: "+e.message},{status:500});
  }
}
