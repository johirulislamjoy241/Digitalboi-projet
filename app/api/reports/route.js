import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.shopId) return NextResponse.json({});

  const { searchParams } = new URL(req.url);
  const now  = new Date();
  const from = searchParams.get('from') || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const to   = searchParams.get('to')   || now.toISOString().split('T')[0];
  const toFull = to + 'T23:59:59';

  try {
    const [salesRes, expRes, purRes, cusRes, productsRes] = await Promise.all([
      // ✅ FIXED: paid_amount→paid, due_amount→due, cost_price→buy_price (products join দিয়ে)
      supabaseAdmin.from('sales')
        .select('total, paid, due, payment_method, status, created_at, sale_items(quantity, unit_price, product_id, products(buy_price, name))')
        .eq('shop_id', user.shopId).gte('created_at', from).lte('created_at', toFull),

      // ✅ FIXED: expenses.date column নেই — created_at দিয়ে filter
      supabaseAdmin.from('expenses')
        .select('amount, category, created_at')
        .eq('shop_id', user.shopId).gte('created_at', from).lte('created_at', toFull),

      supabaseAdmin.from('purchases')
        .select('total').eq('shop_id', user.shopId).gte('created_at', from).lte('created_at', toFull),

      supabaseAdmin.from('customers')
        .select('due_amount').eq('shop_id', user.shopId),

      // ✅ FIXED: stock_quantity→stock, selling_price→sell_price, cost_price→buy_price
      supabaseAdmin.from('products')
        .select('name, stock, sell_price, buy_price')
        .eq('shop_id', user.shopId).eq('is_active', true),
    ]);

    const sales         = salesRes.data  || [];
    const expenses      = expRes.data    || [];
    const totalSales    = sales.reduce((s, x) => s + Number(x.total || 0), 0);
    const totalPaid     = sales.reduce((s, x) => s + Number(x.paid  || 0), 0);  // ✅ FIXED
    const totalDue      = (cusRes.data || []).reduce((s, x) => s + Number(x.due_amount || 0), 0);
    const totalExpenses = expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
    const totalPurchase = (purRes.data || []).reduce((s, x) => s + Number(x.total || 0), 0);

    // ✅ FIXED: লাভ = (বিক্রয় মূল্য - ক্রয় মূল্য) × পরিমাণ — buy_price products join থেকে
    let totalProfit = 0;
    sales.forEach(s => {
      (s.sale_items || []).forEach(i => {
        const buyPrice = i.products?.buy_price || 0;
        totalProfit += (Number(i.unit_price) - Number(buyPrice)) * Number(i.quantity);
      });
    });
    totalProfit -= totalExpenses;

    // মাসিক চার্ট
    const monthMap = {};
    sales.forEach(s => {
      const m = new Date(s.created_at).toLocaleDateString('bn-BD', { month: 'short' });
      monthMap[m] = (monthMap[m] || 0) + Number(s.total);
    });
    const monthlyChart = Object.entries(monthMap).map(([name, value]) => ({ name, value: Math.round(value) }));

    // সেরা পণ্য
    const productSales = {};
    sales.forEach(s => {
      (s.sale_items || []).forEach(i => {
        const key = i.products?.name || 'অজানা';
        productSales[key] = (productSales[key] || 0) + Number(i.quantity);
      });
    });
    const topProducts = Object.entries(productSales)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty).slice(0, 10);

    // লো স্টক পণ্য তালিকা
    const lowStock = (productsRes.data || []).filter(p => Number(p.stock) <= 5);

    return NextResponse.json({
      totalSales:    Math.round(totalSales),
      totalPaid:     Math.round(totalPaid),
      totalDue:      Math.round(totalDue),
      totalExpenses: Math.round(totalExpenses),
      totalPurchase: Math.round(totalPurchase),
      totalProfit:   Math.round(totalProfit),
      totalOrders:   sales.length,
      monthlyChart,
      topProducts,
      lowStock,
      paymentMethods: sales.reduce((m, s) => {
        m[s.payment_method] = (m[s.payment_method] || 0) + Number(s.total);
        return m;
      }, {}),
    });
  } catch (e) {
    console.error('Reports error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
