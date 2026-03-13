import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.shopId) return NextResponse.json([]);
  try {
    const { data, error } = await supabaseAdmin.from('suppliers').select('*').eq('shop_id',user.shopId).eq('is_active',true).order('name');
    if (error) throw error;
    return NextResponse.json(data);
  } catch(e) { return NextResponse.json({error:e.message},{status:500}); }
}

export async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { name, phone, address, notes } = await req.json();
    if (!name) return NextResponse.json({ error: 'সাপ্লাইয়ারের নাম দিন' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('suppliers').insert({
      shop_id: user.shopId, name, phone: phone||null, address: address||null, notes: notes||null
    }).select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch(e) { return NextResponse.json({error:e.message},{status:500}); }
}
