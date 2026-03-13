import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req, { params }) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin.from('sales')
    .select('*, sale_items(*), customers(id,name,phone,address), shops(shop_name,address,phone,shop_logo)')
    .eq('id', params.id).eq('shop_id', user.shopId).maybeSingle();
  if (error || !data) return NextResponse.json({ error: 'বিক্রয় পাওয়া যায়নি' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req, { params }) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { action, amount, method } = await req.json();

    if (action === 'collect_due') {
      const amt = Number(amount);
      if (!amt || amt <= 0) return NextResponse.json({ error: 'বৈধ পরিমাণ দিন' }, { status: 400 });

      // sale আনো
      const { data: sale } = await supabaseAdmin.from('sales')
        .select('*').eq('id', params.id).eq('shop_id', user.shopId).single();
      if (!sale) return NextResponse.json({ error: 'বিক্রয় পাওয়া যায়নি' }, { status: 404 });

      const newPaid = Number(sale.paid_amount) + amt;
      const newDue  = Math.max(0, Number(sale.total) - newPaid);
      const newStatus = newDue <= 0 ? 'completed' : 'partial';

      const { data, error } = await supabaseAdmin.from('sales').update({
        paid_amount: Math.round(newPaid * 100) / 100,
        due_amount:  Math.round(newDue  * 100) / 100,
        status: newStatus,
      }).eq('id', params.id).select().single();
      if (error) throw error;

      // Customer due আপডেট — .raw() ছাড়া, manual JS math
      if (sale.customer_id) {
        const { data: cust } = await supabaseAdmin.from('customers')
          .select('due_amount, total_paid').eq('id', sale.customer_id).single();
        if (cust) {
          const newCustDue  = Math.max(0, Number(cust.due_amount) - amt);
          const newCustPaid = Number(cust.total_paid) + amt;
          await supabaseAdmin.from('customers').update({
            due_amount: Math.round(newCustDue  * 100) / 100,
            total_paid: Math.round(newCustPaid * 100) / 100,
          }).eq('id', sale.customer_id);
        }
      }

      // Payment log
      await supabaseAdmin.from('payments').insert({
        shop_id: user.shopId,
        type: 'income',
        category: 'sale_due_collection',
        reference_id: params.id,
        amount: amt,
        method: method || 'cash',
        note: `Invoice ${sale.invoice_number} — বাকি আদায়`,
      }).catch(() => {});

      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Unknown action: ' + action }, { status: 400 });
  } catch (e) {
    console.error('Sale PATCH error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
