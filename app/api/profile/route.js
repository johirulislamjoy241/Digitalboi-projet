export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function GET(req) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  const { data, error } = await supabaseAdmin.from("users")
    .select("id,name,phone,email,role,profile_photo,is_active,last_login,created_at")
    .eq("id", auth.userId).maybeSingle();

  if (error || !data) return NextResponse.json({ error:"ব্যবহারকারী পাওয়া যায়নি" }, { status:404 });
  return NextResponse.json({ success:true, data });
}

export async function PATCH(req) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  try {
    const body = await req.json();

    // পাসওয়ার্ড পরিবর্তন — oldPassword বা currentPassword দুটোই সাপোর্ট করে
    const oldPw = body.oldPassword || body.currentPassword;
    if (body.action === "change_password" || oldPw) {
      const newPassword = body.newPassword || body.newPass;
      if (!oldPw || !newPassword)
        return NextResponse.json({ error:"পাসওয়ার্ড দিন" }, { status:400 });
      if (newPassword.length < 6)
        return NextResponse.json({ error:"নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষর" }, { status:400 });

      const { data: u } = await supabaseAdmin.from("users")
        .select("password_hash").eq("id", auth.userId).single();
      if (!u?.password_hash) return NextResponse.json({ error:"পাসওয়ার্ড সেট নেই" }, { status:400 });
      const valid = await bcrypt.compare(oldPw, u.password_hash);
      if (!valid) return NextResponse.json({ error:"বর্তমান পাসওয়ার্ড ভুল" }, { status:400 });

      const hash = await bcrypt.hash(newPassword, 12);
      await supabaseAdmin.from("users").update({ password_hash:hash }).eq("id", auth.userId);
      return NextResponse.json({ success:true, message:"পাসওয়ার্ড পরিবর্তন হয়েছে" });
    }

    // প্রোফাইল আপডেট
    const update = {};
    if (body.name         !== undefined) update.name          = body.name;
    if (body.fullName     !== undefined) update.name          = body.fullName; // legacy
    if (body.email        !== undefined) update.email         = body.email;
    if (body.profilePhoto !== undefined) update.profile_photo = body.profilePhoto;

    if (Object.keys(update).length === 0)
      return NextResponse.json({ error:"কোনো আপডেট ডেটা নেই" }, { status:400 });

    const { data, error } = await supabaseAdmin.from("users")
      .update(update).eq("id", auth.userId)
      .select("id,name,phone,email,role,profile_photo").single();

    if (error) throw error;
    return NextResponse.json({ success:true, data });
  } catch(e) {
    return NextResponse.json({ error:e.message }, { status:500 });
  }
}
