import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.shopId) return NextResponse.json([]);
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')||'';
  const hasDue = searchParams.get('hasDue');
  try {
    let q = supabaseAdmin.from('customers').select('*').eq('shop_id',user.shopId).eq('is_active',true).order('name');
    if (search) q=q.ilike('name',`%${search}%`);
    if (hasDue==='true') q=q.gt('due_amount',0);
    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json(data);
  } catch(e) { return NextResponse.json({error:e.message},{status:500}); }
}

export async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { name, phone, address, notes } = await req.json();
    if (!name) return NextResponse.json({ error: 'কাস্টমারের নাম দিন' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('customers').insert({
      shop_id: user.shopId, name, phone: phone||null, address: address||null, notes: notes||null
    }).select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch(e) { return NextResponse.json({error:e.message},{status:500}); }
}
