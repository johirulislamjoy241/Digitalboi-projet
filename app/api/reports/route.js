import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ── shopId দিয়ে কাজ করে (token ছাড়াও) — dashboard-এর মতো ──
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get('shopId');
  if (!shopId) return NextResponse.json({ error: 'shopId প্রয়োজন' }, { status: 400 });

  const now  = new Date();
  const from = searchParams.get('from') || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to   = searchParams.get('to')   || now.toISOString().slice(0, 10);
  const fromFull = from + 'T00:00:00.000Z';
  const toFull   = to   + 'T23:59:59.999Z';

  try {
    const [salesRes, expRes, purRes, productsRes] = await Promise.all([
      supabaseAdmin.from('sales')
        .select('total, paid, due, payment_method, status, created_at, sale_items(quantity, unit_price, product_name, products(buy_price, name))')
        .eq('shop_id', shopId).gte('created_at', fromFull).lte('created_at', toFull),

      supabaseAdmin.from('expenses')
        .select('amount, category, created_at')
        .eq('shop_id', shopId).eq('is_deleted', false)
        .gte('created_at', fromFull).lte('created_at', toFull),

      supabaseAdmin.from('purchases')
        .select('total, paid, due')
        .eq('shop_id', shopId).gte('created_at', fromFull).lte('created_at', toFull),

      supabaseAdmin.from('products')
        .select('name, stock, sell_price, buy_price, low_stock_alert, unit')
        .eq('shop_id', shopId).eq('is_active', true),
    ]);

    const sales    = salesRes.data  || [];
    const expenses = expRes.data    || [];
    const products = productsRes.data || [];

    const totalSales    = sales.reduce((s, x) => s + Number(x.total || 0), 0);
    const totalPaid     = sales.reduce((s, x) => s + Number(x.paid  || 0), 0);
    const totalDue      = sales.reduce((s, x) => s + Number(x.due   || 0), 0);
    const totalExpenses = expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
    const totalPurchase = (purRes.data || []).reduce((s, x) => s + Number(x.total || 0), 0);

    // লাভ = (বিক্রয় মূল্য − ক্রয় মূল্য) × পরিমাণ
    let grossProfit = 0;
    sales.forEach(s => {
      (s.sale_items || []).forEach(item => {
        const buyPrice = Number(item.products?.buy_price || 0);
        grossProfit += (Number(item.unit_price) - buyPrice) * Number(item.quantity);
      });
    });
    const totalProfit = grossProfit - totalExpenses;

    // মাসিক চার্ট
    const monthMap = {};
    sales.forEach(s => {
      const key = new Date(s.created_at).toLocaleDateString('bn-BD', { month: 'short', year: '2-digit' });
      monthMap[key] = (monthMap[key] || 0) + Number(s.total);
    });
    const monthlyChart = Object.entries(monthMap).map(([name, value]) => ({ name, value: Math.round(value) }));

    // সেরা পণ্য
    const productMap = {};
    sales.forEach(s => {
      (s.sale_items || []).forEach(item => {
        const name = item.product_name || item.products?.name || 'অজানা';
        productMap[name] = (productMap[name] || 0) + Number(item.quantity);
      });
    });
    const topProducts = Object.entries(productMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty).slice(0, 10);

    // লো স্টক
    const lowStock = products
      .filter(p => Number(p.stock) <= Number(p.low_stock_alert || 5))
      .sort((a, b) => Number(a.stock) - Number(b.stock));

    // পেমেন্ট breakdown
    const paymentMethods = sales.reduce((m, s) => {
      m[s.payment_method] = (m[s.payment_method] || 0) + Number(s.total);
      return m;
    }, {});

    const statusBreakdown = {
      paid:    sales.filter(s => s.status === 'paid').length,
      due:     sales.filter(s => s.status === 'due').length,
      partial: sales.filter(s => s.status === 'partial').length,
    };

    return NextResponse.json({
      totalSales:     Math.round(totalSales),
      totalPaid:      Math.round(totalPaid),
      totalDue:       Math.round(totalDue),
      totalExpenses:  Math.round(totalExpenses),
      totalPurchase:  Math.round(totalPurchase),
      grossProfit:    Math.round(grossProfit),
      totalProfit:    Math.round(totalProfit),
      totalOrders:    sales.length,
      monthlyChart,
      topProducts,
      lowStock,
      paymentMethods,
      statusBreakdown,
    });
  } catch (e) {
    console.error('Reports error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
