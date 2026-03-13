import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin.from('users')
    .select('id,full_name,phone,email,role,profile_photo,nid_number,nid_verified,is_active,last_login,created_at')
    .eq('id', user.userId).maybeSingle();
  if (error||!data) return NextResponse.json({ error: 'ব্যবহারকারী পাওয়া যায়নি' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    if (body.action === 'change_password') {
      const { oldPassword, newPassword } = body;
      if (!oldPassword||!newPassword) return NextResponse.json({ error: 'পাসওয়ার্ড দিন' }, { status: 400 });
      if (newPassword.length < 8) return NextResponse.json({ error: 'নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষর' }, { status: 400 });
      const { data: u } = await supabaseAdmin.from('users').select('password_hash').eq('id', user.userId).single();
      const valid = await bcrypt.compare(oldPassword, u.password_hash);
      if (!valid) return NextResponse.json({ error: 'পুরনো পাসওয়ার্ড ভুল' }, { status: 400 });
      const hash = await bcrypt.hash(newPassword, 10);
      await supabaseAdmin.from('users').update({ password_hash: hash }).eq('id', user.userId);
      return NextResponse.json({ success: true, message: 'পাসওয়ার্ড পরিবর্তন হয়েছে' });
    }
    const update = {};
    if (body.fullName) update.full_name = body.fullName;
    if (body.email)    update.email = body.email;
    if (body.nidNumber) update.nid_number = body.nidNumber;
    if (body.profilePhoto) update.profile_photo = body.profilePhoto;
    const { data, error } = await supabaseAdmin.from('users').update(update).eq('id', user.userId).select('id,full_name,phone,email,role,profile_photo,nid_verified').single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch(e) { return NextResponse.json({error:e.message},{status:500}); }
}
