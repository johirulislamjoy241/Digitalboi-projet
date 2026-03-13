import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.shopId) return NextResponse.json({
    todaySales:0,todayProfit:0,totalProducts:0,
    totalOrders:0,lowStockCount:0,outOfStockCount:0,totalDue:0,recentSales:[]
  });

  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);

  try {
    const [salesRes, productsRes, customersRes, recentRes] = await Promise.all([
      supabaseAdmin.from('sales')
        .select('total, paid_amount, due_amount, sale_items(quantity, unit_price, cost_price)')
        .eq('shop_id', user.shopId)
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString()),

      supabaseAdmin.from('products')
        .select('id, stock_quantity, min_stock_alert')
        .eq('shop_id', user.shopId).eq('is_active', true),

      supabaseAdmin.from('customers')
        .select('due_amount').eq('shop_id', user.shopId),

      supabaseAdmin.from('sales')
        .select('id,invoice_number,total,status,payment_method,created_at,customers(name)')
        .eq('shop_id', user.shopId)
        .order('created_at', { ascending: false }).limit(5),
    ]);

    const todaySales = (salesRes.data||[]).reduce((s,x)=>s+Number(x.total||0),0);
    let todayProfit = 0;
    (salesRes.data||[]).forEach(sale=>{
      (sale.sale_items||[]).forEach(item=>{
        todayProfit += (Number(item.unit_price)-Number(item.cost_price||0))*item.quantity;
      });
    });

    const products = productsRes.data||[];
    const lowStockCount = products.filter(p=>p.stock_quantity>0&&p.stock_quantity<=p.min_stock_alert).length;
    const outOfStockCount = products.filter(p=>p.stock_quantity<=0).length;
    const totalDue = (customersRes.data||[]).reduce((s,x)=>s+Number(x.due_amount||0),0);

    return NextResponse.json({
      todaySales: Math.round(todaySales),
      todayProfit: Math.round(todayProfit),
      totalProducts: products.length,
      lowStockCount, outOfStockCount,
      totalDue: Math.round(totalDue),
      totalOrders: (salesRes.data||[]).length,
      recentSales: recentRes.data||[],
    });
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
