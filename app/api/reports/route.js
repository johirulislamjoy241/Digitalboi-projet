export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.shopId) return NextResponse.json({});
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type')||'overview';
  const now = new Date();
  const from = searchParams.get('from')||new Date(now.getFullYear(),now.getMonth(),1).toISOString().split('T')[0];
  const to = searchParams.get('to')||now.toISOString().split('T')[0];
  const toFull = to+'T23:59:59';

  try {
    const [salesRes, expRes, purRes, cusRes, productsRes] = await Promise.all([
      supabaseAdmin.from('sales').select('total,paid_amount,due_amount,payment_method,status,created_at,sale_items(quantity,unit_price,cost_price)').eq('shop_id',user.shopId).gte('created_at',from).lte('created_at',toFull),
      supabaseAdmin.from('expenses').select('amount,category,date').eq('shop_id',user.shopId).gte('date',from).lte('date',to),
      supabaseAdmin.from('purchases').select('total').eq('shop_id',user.shopId).gte('created_at',from).lte('created_at',toFull),
      supabaseAdmin.from('customers').select('due_amount').eq('shop_id',user.shopId),
      supabaseAdmin.from('products').select('name,stock_quantity,selling_price,cost_price').eq('shop_id',user.shopId).eq('is_active',true),
    ]);

    const sales = salesRes.data||[];
    const expenses = expRes.data||[];
    const totalSales = sales.reduce((s,x)=>s+Number(x.total),0);
    const totalPaid = sales.reduce((s,x)=>s+Number(x.paid_amount),0);
    const totalDue = (cusRes.data||[]).reduce((s,x)=>s+Number(x.due_amount||0),0);
    const totalExpenses = expenses.reduce((s,x)=>s+Number(x.amount),0);
    const totalPurchase = (purRes.data||[]).reduce((s,x)=>s+Number(x.total),0);

    let totalProfit = 0;
    sales.forEach(s=>{
      (s.sale_items||[]).forEach(i=>{
        totalProfit += (Number(i.unit_price)-Number(i.cost_price||0))*Number(i.quantity);
      });
    });
    totalProfit -= totalExpenses;

    // Monthly chart
    const monthMap = {};
    sales.forEach(s=>{
      const m = new Date(s.created_at).toLocaleDateString('bn-BD',{month:'short'});
      monthMap[m] = (monthMap[m]||0) + Number(s.total);
    });
    const monthlyChart = Object.entries(monthMap).map(([name,value])=>({name,value:Math.round(value)}));

    // Top products by sales
    const productSales = {};
    sales.forEach(s=>{
      (s.sale_items||[]).forEach(i=>{
        productSales[i.product_name] = (productSales[i.product_name]||0) + i.quantity;
      });
    });
    const topProducts = Object.entries(productSales)
      .map(([name,qty])=>({name,qty}))
      .sort((a,b)=>b.qty-a.qty).slice(0,10);

    return NextResponse.json({
      totalSales:Math.round(totalSales), totalPaid:Math.round(totalPaid),
      totalDue:Math.round(totalDue), totalExpenses:Math.round(totalExpenses),
      totalPurchase:Math.round(totalPurchase), totalProfit:Math.round(totalProfit),
      totalOrders:sales.length, monthlyChart, topProducts,
      paymentMethods: sales.reduce((m,s)=>{m[s.payment_method]=(m[s.payment_method]||0)+Number(s.total);return m;},{}),
    });
  } catch(e) { return NextResponse.json({error:e.message},{status:500}); }
}
