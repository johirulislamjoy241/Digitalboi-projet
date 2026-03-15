import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // ✅ FIXED: full_name→name, nid_number→nid, nid_verified নেই schema-তে
  const { data, error } = await supabaseAdmin.from('users')
    .select('id, name, phone, email, role, profile_photo, nid, dob, gender, is_active, last_login, created_at')
    .eq('id', user.userId).maybeSingle();

  if (error || !data) return NextResponse.json({ error: 'ব্যবহারকারী পাওয়া যায়নি' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();

    if (body.action === 'change_password') {
      const { oldPassword, newPassword } = body;
      if (!oldPassword || !newPassword) return NextResponse.json({ error: 'পাসওয়ার্ড দিন' }, { status: 400 });
      if (newPassword.length < 6) return NextResponse.json({ error: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষর' }, { status: 400 });
      const { data: u } = await supabaseAdmin.from('users').select('password_hash').eq('id', user.userId).single();
      const valid = await bcrypt.compare(oldPassword, u.password_hash);
      if (!valid) return NextResponse.json({ error: 'পুরনো পাসওয়ার্ড ভুল' }, { status: 400 });
      const hash = await bcrypt.hash(newPassword, 10);
      await supabaseAdmin.from('users').update({ password_hash: hash }).eq('id', user.userId);
      return NextResponse.json({ success: true, message: 'পাসওয়ার্ড পরিবর্তন হয়েছে' });
    }

    const update = {};
    // ✅ FIXED: full_name→name, nid_number→nid
    if (body.name         !== undefined) update.name          = body.name;
    if (body.fullName     !== undefined) update.name          = body.fullName;  // backward compat
    if (body.email        !== undefined) update.email         = body.email;
    if (body.nid          !== undefined) update.nid           = body.nid;
    if (body.nidNumber    !== undefined) update.nid           = body.nidNumber; // backward compat
    if (body.dob          !== undefined) update.dob           = body.dob;
    if (body.gender       !== undefined) update.gender        = body.gender;
    if (body.profilePhoto !== undefined) update.profile_photo = body.profilePhoto;

    if (Object.keys(update).length === 0)
      return NextResponse.json({ error: 'কোনো আপডেট ডেটা নেই' }, { status: 400 });

    const { data, error } = await supabaseAdmin.from('users')
      .update(update).eq('id', user.userId)
      .select('id, name, phone, email, role, profile_photo, nid, dob, gender').single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
