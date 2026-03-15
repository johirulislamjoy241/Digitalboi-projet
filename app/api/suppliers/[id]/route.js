import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request, { params }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin.from('suppliers')
    .select('*').eq('id', params.id).eq('shop_id', user.shopId).single();
  if (error || !data) return NextResponse.json({ error: 'পাওয়া যায়নি' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request, { params }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { name, phone, address, payAmount } = await request.json();

    if (payAmount) {
      const amt = Number(payAmount);
      // FIX: manual JS math instead of supabaseAdmin.raw()
      // ✅ FIXED: total_paid → total_purchase (schema অনুযায়ী)
      const { data: sup } = await supabaseAdmin.from('suppliers')
        .select('due_amount, total_purchase').eq('id', params.id).single();
      if (!sup) return NextResponse.json({ error: 'সরবরাহকারী পাওয়া যায়নি' }, { status: 404 });

      const newDue  = Math.max(0, Number(sup.due_amount) - amt);

      await supabaseAdmin.from('suppliers').update({
        due_amount: Math.round(newDue * 100) / 100,
      }).eq('id', params.id);

      return NextResponse.json({ success: true });
    }

    const update = {};
    if (name !== undefined)    update.name = name;
    if (phone !== undefined)   update.phone = phone;
    if (address !== undefined) update.address = address;

    const { data, error } = await supabaseAdmin.from('suppliers')
      .update(update).eq('id', params.id).eq('shop_id', user.shopId).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { error } = await supabaseAdmin.from('suppliers')
    .update({ is_active: false }).eq('id', params.id).eq('shop_id', user.shopId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
