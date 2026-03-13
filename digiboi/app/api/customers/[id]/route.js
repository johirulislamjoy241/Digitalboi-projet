import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req, { params }) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin.from('customers').select('*').eq('id',params.id).eq('shop_id',user.shopId).maybeSingle();
  if (!data) return NextResponse.json({ error: 'কাস্টমার পাওয়া যায়নি' }, { status: 404 });
  const { data: sales } = await supabaseAdmin.from('sales').select('*').eq('customer_id',params.id).order('created_at',{ascending:false});
  return NextResponse.json({ ...data, sales: sales||[] });
}

export async function PATCH(req, { params }) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    if (body.action === 'pay') {
      const amount = Number(body.amount);
      const { data: c } = await supabaseAdmin.from('customers').select('due_amount,total_paid').eq('id',params.id).single();
      const newDue = Math.max(0, Number(c.due_amount) - amount);
      const { data, error } = await supabaseAdmin.from('customers').update({
        total_paid: Number(c.total_paid) + amount, due_amount: newDue
      }).eq('id',params.id).select().single();
      if (error) throw error;
      await supabaseAdmin.from('payments').insert({
        shop_id: user.shopId, type: 'income', category: 'customer_payment',
        reference_id: params.id, amount, method: body.method||'cash',
        note: `${data.name} এর বাকি পেমেন্ট`
      });
      return NextResponse.json(data);
    }
    const update = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.phone !== undefined) update.phone = body.phone;
    if (body.address !== undefined) update.address = body.address;
    if (body.notes !== undefined) update.notes = body.notes;
    const { data, error } = await supabaseAdmin.from('customers').update(update).eq('id',params.id).eq('shop_id',user.shopId).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch(e) { return NextResponse.json({error:e.message},{status:500}); }
}

export async function DELETE(req, { params }) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: c } = await supabaseAdmin.from('customers').select('due_amount').eq('id',params.id).single();
  if (c?.due_amount > 0) return NextResponse.json({ error: 'বাকি পরিশোধ করুন তারপর মুছুন' }, { status: 400 });
  await supabaseAdmin.from('customers').update({ is_active: false }).eq('id',params.id).eq('shop_id',user.shopId);
  return NextResponse.json({ success: true });
}
