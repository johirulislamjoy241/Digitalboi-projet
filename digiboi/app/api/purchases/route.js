import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.shopId) return NextResponse.json([]);
  const { data } = await supabaseAdmin.from('purchases')
    .select('*, purchase_items(*), suppliers(name)')
    .eq('shop_id', user.shopId).order('created_at', { ascending: false });
  return NextResponse.json(data || []);
}

export async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { supplierId, items, paidAmount, paymentMethod, notes } = await req.json();
    if (!items?.length) return NextResponse.json({ error: 'পণ্য যোগ করুন' }, { status: 400 });

    const total = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);
    const paid  = paidAmount !== undefined ? Number(paidAmount) : total;
    const due   = Math.max(0, total - paid);

    const { data: purchase, error: pErr } = await supabaseAdmin.from('purchases').insert({
      shop_id:        user.shopId,
      supplier_id:    supplierId || null,
      total,
      paid_amount:    paid,
      due_amount:     due,
      payment_method: paymentMethod || 'cash',
      notes:          notes || null,
    }).select().single();
    if (pErr) throw pErr;

    const purchaseItems = items.map(i => ({
      purchase_id:   purchase.id,
      product_id:    i.productId || null,
      product_name:  i.productName || i.name,
      quantity:      Number(i.quantity),
      unit_price:    Number(i.unitPrice),
      subtotal:      Number(i.quantity) * Number(i.unitPrice),
    }));
    const { error: iErr } = await supabaseAdmin.from('purchase_items').insert(purchaseItems);
    if (iErr) throw iErr;

    // ── FIX: Stock increment — ক্রয় করলে স্টক বাড়াও ──
    const stockUpdates = purchaseItems
      .filter(i => i.product_id)
      .map(async i => {
        const { data: prod } = await supabaseAdmin.from('products')
          .select('stock_quantity, cost_price').eq('id', i.product_id).eq('shop_id', user.shopId).single();
        if (prod) {
          const newStock = Number(prod.stock_quantity) + i.quantity;
          // Cost price আপডেট (weighted average)
          const newCost = i.unit_price;
          await supabaseAdmin.from('products').update({
            stock_quantity: newStock,
            cost_price:     newCost, // latest purchase price
          }).eq('id', i.product_id).eq('shop_id', user.shopId);
        }
      });
    await Promise.allSettled(stockUpdates);

    // Supplier due আপডেট
    if (supplierId && due > 0) {
      const { data: sup } = await supabaseAdmin.from('suppliers')
        .select('due_amount').eq('id', supplierId).single();
      if (sup) {
        await supabaseAdmin.from('suppliers').update({
          due_amount: Math.round((Number(sup.due_amount) + due) * 100) / 100,
        }).eq('id', supplierId);
      }
    }

    return NextResponse.json(purchase, { status: 201 });
  } catch (e) {
    console.error('Purchase POST error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
