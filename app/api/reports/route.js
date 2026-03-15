import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.shopId) return NextResponse.json({ error: 'shopId নেই' }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const now  = new Date();
  const from = searchParams.get('from') || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to   = searchParams.get('to')   || now.toISOString().slice(0, 10);
  const toFull = to + 'T23:59:59.999Z';
  const fromFull = from + 'T00:00:00.000Z';

  try {
    // সব ডেটা একসাথে fetch
    const [salesRes, expRes, purRes, productsRes] = await Promise.all([
      supabaseAdmin.from('sales')
        .select('total, paid, due, payment_method, status, created_at, sale_items(quantity, unit_price, product_id, product_name, products(buy_price, name))')
        .eq('shop_id', user.shopId)
        .gte('created_at', fromFull)
        .lte('created_at', toFull),

      supabaseAdmin.from('expenses')
        .select('amount, category, created_at')
        .eq('shop_id', user.shopId)
        .eq('is_deleted', false)
        .gte('created_at', fromFull)
        .lte('created_at', toFull),

      supabaseAdmin.from('purchases')
        .select('total, paid, due')
        .eq('shop_id', user.shopId)
        .gte('created_at', fromFull)
        .lte('created_at', toFull),

      supabaseAdmin.from('products')
        .select('name, stock, sell_price, buy_price, low_stock_alert, unit')
        .eq('shop_id', user.shopId)
        .eq('is_active', true),
    ]);

    const sales    = salesRes.data  || [];
    const expenses = expRes.data    || [];
    const purchases = purRes.data   || [];
    const products = productsRes.data || [];

    // ── মূল হিসাব ──
    const totalSales    = sales.reduce((s, x) => s + Number(x.total || 0), 0);
    const totalPaid     = sales.reduce((s, x) => s + Number(x.paid  || 0), 0);
    const totalDue      = sales.reduce((s, x) => s + Number(x.due   || 0), 0); // sales.due থেকে
    const totalExpenses = expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
    const totalPurchase = purchases.reduce((s, x) => s + Number(x.total || 0), 0);

    // ── লাভ হিসাব: (বিক্রয় মূল্য − ক্রয় মূল্য) × পরিমাণ − খরচ ──
    let grossProfit = 0;
    sales.forEach(s => {
      (s.sale_items || []).forEach(item => {
        const buyPrice = Number(item.products?.buy_price || 0);
        grossProfit += (Number(item.unit_price) - buyPrice) * Number(item.quantity);
      });
    });
    const totalProfit = grossProfit - totalExpenses;

    // ── মাসিক/দৈনিক চার্ট ──
    const monthMap = {};
    sales.forEach(s => {
      const d = new Date(s.created_at);
      const key = d.toLocaleDateString('bn-BD', { month: 'short', year: 'numeric' });
      monthMap[key] = (monthMap[key] || 0) + Number(s.total);
    });
    const monthlyChart = Object.entries(monthMap)
      .map(([name, value]) => ({ name, value: Math.round(value) }));

    // ── সেরা পণ্য ──
    const productSalesMap = {};
    sales.forEach(s => {
      (s.sale_items || []).forEach(item => {
        // product_name (sale_items column) অথবা products join থেকে
        const name = item.product_name || item.products?.name || 'অজানা';
        productSalesMap[name] = (productSalesMap[name] || 0) + Number(item.quantity);
      });
    });
    const topProducts = Object.entries(productSalesMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    // ── লো স্টক ──
    const lowStock = products
      .filter(p => Number(p.stock) <= Number(p.low_stock_alert || 5))
      .sort((a, b) => Number(a.stock) - Number(b.stock));

    // ── পেমেন্ট পদ্ধতি breakdown ──
    const paymentMethods = sales.reduce((m, s) => {
      const key = s.payment_method || 'অজানা';
      m[key] = (m[key] || 0) + Number(s.total);
      return m;
    }, {});

    // ── স্ট্যাটাস breakdown ──
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
