import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.shopId) return NextResponse.json([]);

  const { searchParams } = new URL(req.url);
  const from       = searchParams.get('from');
  const to         = searchParams.get('to');
  const limit      = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const customerId = searchParams.get('customerId');
  const status     = searchParams.get('status');
  const search     = searchParams.get('search');

  try {
    let q = supabaseAdmin.from('sales')
      .select('*, sale_items(*), customers(id,name,phone)')
      .eq('shop_id', user.shopId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (from)       q = q.gte('created_at', from);
    if (to)         q = q.lte('created_at', to.includes('T') ? to : to + 'T23:59:59');
    if (customerId) q = q.eq('customer_id', customerId);
    if (status)     q = q.eq('status', status);

    const { data, error } = await q;
    if (error) throw error;

    const result = search
      ? data.filter(s =>
          s.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
          s.customers?.name?.toLowerCase().includes(search.toLowerCase())
        )
      : data;

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.shopId) return NextResponse.json({ error: 'দোকান নেই' }, { status: 400 });

  try {
    const { items, customerId, discount, paidAmount, paymentMethod, notes } = await req.json();
    if (!items?.length) return NextResponse.json({ error: 'পণ্য যোগ করুন' }, { status: 400 });

    // ── Price calculation ──
    const subtotal = items.reduce((s, i) => {
      const price = i.selling_price != null ? Number(i.selling_price) : Number(i.unitPrice ?? 0);
      const qty   = Number(i.qty ?? i.quantity ?? 1);
      return s + price * qty;
    }, 0);

    const discountAmt = Number(discount ?? 0);
    const total       = Math.max(0, subtotal - discountAmt);

    // BUG FIX: if paymentMethod='due', paid=0, due=total
    let paid;
    if (paymentMethod === 'due') {
      paid = 0;
    } else if (paidAmount != null && paidAmount !== '') {
      paid = Number(paidAmount);
    } else {
      paid = total;
    }
    const due = Math.max(0, total - paid);

    let saleStatus = 'completed';
    if (due > 0 && paid <= 0) saleStatus = 'due';
    else if (due > 0)         saleStatus = 'partial';

    // ── Invoice number (race-condition safe) ──
    const now      = new Date();
    const dateStr  = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    const randPart = Math.random().toString(36).substr(2, 5).toUpperCase();
    const msStr    = String(now.getTime()).slice(-5);
    const invoiceNumber = `INV-${dateStr}-${msStr}${randPart}`;

    // ── Insert sale ──
    const { data: sale, error: sErr } = await supabaseAdmin.from('sales').insert({
      shop_id:        user.shopId,
      sold_by:        user.userId,
      customer_id:    customerId || null,
      invoice_number: invoiceNumber,
      subtotal:       Math.round(subtotal    * 100) / 100,
      discount:       Math.round(discountAmt * 100) / 100,
      total:          Math.round(total       * 100) / 100,
      paid_amount:    Math.round(paid        * 100) / 100,
      due_amount:     Math.round(due         * 100) / 100,
      status:         saleStatus,
      payment_method: paymentMethod || 'cash',
      notes:          notes || null,
    }).select().single();

    if (sErr) {
      if (sErr.code === '23505') {
        // duplicate invoice — retry with different random
        const retryInvoice = `INV-${dateStr}-${Date.now().toString(36).toUpperCase()}`;
        const { data: s2, error: e2 } = await supabaseAdmin.from('sales').insert({
          shop_id: user.shopId, sold_by: user.userId, customer_id: customerId || null,
          invoice_number: retryInvoice, subtotal, discount: discountAmt, total,
          paid_amount: paid, due_amount: due, status: saleStatus,
          payment_method: paymentMethod || 'cash', notes: notes || null,
        }).select().single();
        if (e2) throw e2;
        return await finalizeSale(s2, items, customerId, due, user.shopId);
      }
      throw sErr;
    }

    return await finalizeSale(sale, items, customerId, due, user.shopId);

  } catch (e) {
    console.error('Sale POST error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function finalizeSale(sale, items, customerId, due, shopId) {
  // ── Insert sale_items ──
  const saleItems = items.map(i => {
    const price     = i.selling_price != null ? Number(i.selling_price) : Number(i.unitPrice ?? 0);
    const qty       = Number(i.qty ?? i.quantity ?? 1);
    const costPrice = i.cost_price    != null ? Number(i.cost_price)    : Number(i.costPrice ?? 0);
    return {
      sale_id:      sale.id,
      product_id:   i.id || i.productId || null,
      product_name: i.name || i.productName || 'পণ্য',
      quantity:     qty,
      unit_price:   price,
      cost_price:   costPrice,
      discount:     Number(i.itemDiscount ?? 0),
      subtotal:     Math.round(price * qty * 100) / 100,
    };
  });

  const { error: iErr } = await supabaseAdmin.from('sale_items').insert(saleItems);
  if (iErr) {
    await supabaseAdmin.from('sales').delete().eq('id', sale.id);
    return NextResponse.json({ error: 'পণ্য আইটেম সংরক্ষণে ব্যর্থ: ' + iErr.message }, { status: 500 });
  }

  // ── CRITICAL FIX: Stock deduction — প্রতিটি পণ্যের stock কমাও ──
  const stockUpdates = saleItems
    .filter(i => i.product_id)
    .map(async i => {
      const { data: prod } = await supabaseAdmin.from('products')
        .select('stock_quantity').eq('id', i.product_id).eq('shop_id', shopId).single();
      if (prod) {
        const newStock = Math.max(0, Number(prod.stock_quantity) - i.quantity);
        await supabaseAdmin.from('products')
          .update({ stock_quantity: newStock })
          .eq('id', i.product_id).eq('shop_id', shopId);
      }
    });
  await Promise.allSettled(stockUpdates); // error হলেও sale cancel করবো না

  // ── CRITICAL FIX: Customer due_amount আপডেট ──
  if (customerId && due > 0) {
    const { data: cust } = await supabaseAdmin.from('customers')
      .select('due_amount, total_purchase').eq('id', customerId).single();
    if (cust) {
      await supabaseAdmin.from('customers').update({
        due_amount:     Math.round((Number(cust.due_amount)    + due)         * 100) / 100,
        total_purchase: Math.round((Number(cust.total_purchase) + sale.total) * 100) / 100,
      }).eq('id', customerId);
    }
  } else if (customerId) {
    // No due — শুধু total_purchase বাড়াও
    const { data: cust } = await supabaseAdmin.from('customers')
      .select('total_purchase').eq('id', customerId).single();
    if (cust) {
      await supabaseAdmin.from('customers').update({
        total_purchase: Math.round((Number(cust.total_purchase) + sale.total) * 100) / 100,
      }).eq('id', customerId);
    }
  }

  return NextResponse.json({ ...sale, items: saleItems }, { status: 201 });
}
