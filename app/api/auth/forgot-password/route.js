export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { normalizePhone, validateBDPhone } from "@/lib/helpers";

export async function POST(req) {
  try {
    const body = await req.json();
    const { step, phone, shopName, recoveryCode, newPassword } = body;

    if (!phone?.trim()) return NextResponse.json({success:false,error:"ফোন নম্বর দিন"},{status:400});
    if (!validateBDPhone(phone)) return NextResponse.json({success:false,error:"সঠিক বাংলাদেশি নম্বর দিন"},{status:400});
    const normalized = normalizePhone(phone);

    const { data:user } = await supabaseAdmin.from("users")
      .select("id,name,is_active,is_blocked,recovery_code").eq("phone",normalized).maybeSingle();
    if (!user)       return NextResponse.json({success:false,error:"এই নম্বরে কোনো অ্যাকাউন্ট নেই"},{status:404});
    if (!user.is_active)  return NextResponse.json({success:false,error:"অ্যাকাউন্ট নিষ্ক্রিয়"},{status:403});
    if (user.is_blocked)  return NextResponse.json({success:false,error:"অ্যাকাউন্ট ব্লক"},{status:403});

    const { data:shop } = await supabaseAdmin.from("shops").select("id,name").eq("owner_id",user.id).single();
    if (!shop) return NextResponse.json({success:false,error:"দোকান পাওয়া যায়নি"},{status:404});

    const norm = s => s.trim().toLowerCase().replace(/\s+/g," ");

    // Step 1: Phone check → return hint
    if (!step||step===1) {
      const maskedName = user.name.length>2
        ? user.name[0]+"*".repeat(user.name.length-2)+user.name[user.name.length-1]
        : user.name[0]+"*";
      const hasRecovery = !!user.recovery_code;
      return NextResponse.json({
        success:true, maskedName,
        methods: hasRecovery ? ["shop","recovery"] : ["shop"],
        hint:"অ্যাকাউন্ট পাওয়া গেছে। পরিচয় নিশ্চিত করুন।"
      });
    }

    // Step 2A: Verify by shop name
    if (step==="2a") {
      if (!shopName?.trim()) return NextResponse.json({success:false,error:"দোকানের নাম দিন"},{status:400});
      if (norm(shopName)!==norm(shop.name))
        return NextResponse.json({success:false,error:"দোকানের নাম মিলছে না"},{status:401});
      return NextResponse.json({success:true,verified:true,method:"shop"});
    }

    // Step 2B: Verify by recovery code
    if (step==="2b") {
      if (!recoveryCode||recoveryCode.length!==6)
        return NextResponse.json({success:false,error:"৬ সংখ্যার রিকভারি কোড দিন"},{status:400});
      if (!user.recovery_code)
        return NextResponse.json({success:false,error:"রিকভারি কোড সেট করা নেই। দোকানের নাম ব্যবহার করুন।"},{status:400});
      const match = await bcrypt.compare(recoveryCode, user.recovery_code);
      if (!match) return NextResponse.json({success:false,error:"রিকভারি কোড সঠিক নয়"},{status:401});
      return NextResponse.json({success:true,verified:true,method:"recovery"});
    }

    // Step 3: Set new password (re-verify before saving)
    if (step===3) {
      if (!newPassword||newPassword.length<6)
        return NextResponse.json({success:false,error:"কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন"},{status:400});

      // Must provide either shopName or recoveryCode for security
      let verified = false;
      if (shopName && norm(shopName)===norm(shop.name)) verified=true;
      if (!verified && recoveryCode && user.recovery_code) {
        verified = await bcrypt.compare(recoveryCode, user.recovery_code);
      }
      if (!verified) return NextResponse.json({success:false,error:"পরিচয় যাচাই ব্যর্থ"},{status:401});

      const hash = await bcrypt.hash(newPassword,12);
      const { error } = await supabaseAdmin.from("users").update({password_hash:hash}).eq("id",user.id);
      if (error) throw error;
      return NextResponse.json({success:true,message:"পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!"});
    }

    return NextResponse.json({success:false,error:"অবৈধ অনুরোধ"},{status:400});
  } catch(e) {
    return NextResponse.json({success:false,error:"ব্যর্থ: "+e.message},{status:500});
  }
}
