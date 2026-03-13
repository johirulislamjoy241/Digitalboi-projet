import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.shopId) return NextResponse.json([]);
  const { data } = await supabaseAdmin.from('staff')
    .select('*, users(id,full_name,phone,email,profile_photo,last_login)')
    .eq('shop_id', user.shopId).eq('is_active', true);
  return NextResponse.json(data||[]);
}

export async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['owner','manager'].includes(user.role)) return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 403 });
  try {
    const { fullName, phone, password, role, permissions } = await req.json();
    if (!fullName||!phone||!password) return NextResponse.json({ error: 'নাম, ফোন, পাসওয়ার্ড দিন' }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর' }, { status: 400 });

    // Check duplicate phone
    const { data: ex } = await supabaseAdmin.from('users').select('id').eq('phone', phone).maybeSingle();
    if (ex) return NextResponse.json({ error: 'এই নম্বরে আগেই অ্যাকাউন্ট আছে' }, { status: 400 });

    const hash = await bcrypt.hash(password, 10);
    const { data: newUser, error: uErr } = await supabaseAdmin.from('users').insert({
      full_name: fullName, phone, password_hash: hash, role: role||'cashier'
    }).select().single();
    if (uErr) throw uErr;

    const defaultPerms = { pos: true, inventory: false, reports: false, customers: true, expenses: false };
    const { data: staff, error: sErr } = await supabaseAdmin.from('staff').insert({
      shop_id: user.shopId, user_id: newUser.id,
      role: role||'cashier', permissions: permissions||defaultPerms
    }).select().single();
    if (sErr) throw sErr;
    return NextResponse.json({ ...staff, users: newUser }, { status: 201 });
  } catch(e) { return NextResponse.json({error:e.message},{status:500}); }
}
