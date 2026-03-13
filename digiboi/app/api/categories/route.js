import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.shopId) return NextResponse.json([]);
  const { data, error } = await supabaseAdmin.from('categories')
    .select('*').eq('shop_id',user.shopId).eq('is_active',true).order('name');
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data);
}

export async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { name, icon, color } = await req.json();
    if (!name) return NextResponse.json({ error: 'ক্যাটাগরির নাম দিন' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('categories').insert({
      shop_id: user.shopId, name, icon: icon||'📦', color: color||'#0F4C81'
    }).select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch(e) { return NextResponse.json({error:e.message},{status:500}); }
}

export async function DELETE(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID দিন' }, { status: 400 });
  try {
    await supabaseAdmin.from('categories').update({ is_active: false }).eq('id', id).eq('shop_id', user.shopId);
    return NextResponse.json({ success: true });
  } catch(e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
