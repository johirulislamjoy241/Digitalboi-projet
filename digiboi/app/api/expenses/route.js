import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.shopId) return NextResponse.json([]);
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  try {
    let q = supabaseAdmin.from('expenses').select('*').eq('shop_id',user.shopId).order('created_at',{ascending:false});
    if (from) q=q.gte('date',from);
    if (to)   q=q.lte('date',to);
    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json(data);
  } catch(e) { return NextResponse.json({error:e.message},{status:500}); }
}

export async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { category, description, amount, date } = await req.json();
    if (!description) return NextResponse.json({ error: 'বিবরণ দিন' }, { status: 400 });
    if (!amount||Number(amount)<=0) return NextResponse.json({ error: 'পরিমাণ দিন' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('expenses').insert({
      shop_id: user.shopId, created_by: user.userId,
      category: category||'অন্যান্য', description,
      amount: Number(amount), date: date||new Date().toISOString().split('T')[0]
    }).select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch(e) { return NextResponse.json({error:e.message},{status:500}); }
}
