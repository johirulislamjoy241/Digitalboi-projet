import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req) {
  try {
    const shopId = req.nextUrl.searchParams.get("shopId");
    if (!shopId) return NextResponse.json({ success: false, error: "shopId প্রয়োজন" }, { status: 400 });

    const now   = new Date();
    const today = now.toISOString().slice(0, 10);
    const monthStart = today.slice(0, 7) + "-01";

    // Today's sales
    const { data: todaySales } = await supabaseAdmin.from("sales")
      .select("total,paid,due,sale_items(quantity,unit_price,product_id,products(buy_price))")
      .eq("shop_id", shopId)
      .gte("created_at", today + "T00:00:00.000Z")
      .lte("created_at", today + "T23:59:59.999Z");

    const todayTotal  = todaySales?.reduce((s, x) => s + (+x.total || 0), 0) || 0;
    const todayOrders = todaySales?.length || 0;

    // Today profit
    let todayProfit = 0;
    todaySales?.forEach(s => {
      (s.sale_items || []).forEach(i => {
        const buy = i.products?.buy_price || 0;
        todayProfit += (Number(i.unit_price) - Number(buy)) * Number(i.quantity);
      });
    });

    // Month sales
    const { data: monthSales } = await supabaseAdmin.from("sales")
      .select("total").eq("shop_id", shopId)
      .gte("created_at", monthStart + "T00:00:00.000Z");
    const monthTotal = monthSales?.reduce((s, x) => s + (+x.total || 0), 0) || 0;

    // Low stock products
    const { data: products } = await supabaseAdmin.from("products")
      .select("id,name,stock,low_stock_alert,unit").eq("shop_id", shopId).eq("is_active", true);
    const lowStockItems = (products || []).filter(p => (+p.stock) <= (+p.low_stock_alert));

    // Total due from customers
    const { data: customers } = await supabaseAdmin.from("customers")
      .select("due_amount").eq("shop_id", shopId).gt("due_amount", 0);
    const totalDue = customers?.reduce((s, c) => s + (+c.due_amount || 0), 0) || 0;

    // Recent 5 sales
    const { data: recentSales } = await supabaseAdmin.from("sales")
      .select("id,invoice_id,total,payment_method,status,created_at,customers(name)")
      .eq("shop_id", shopId).order("created_at", { ascending: false }).limit(5);

    // 6-month chart
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = d.toISOString().slice(0, 7) + "-01";
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
      const { data: ms } = await supabaseAdmin.from("sales")
        .select("total").eq("shop_id", shopId)
        .gte("created_at", start + "T00:00:00.000Z")
        .lte("created_at", end + "T23:59:59.999Z");
      const sales  = ms?.reduce((s, x) => s + (+x.total || 0), 0) || 0;
      const profit = Math.round(sales * 0.2); // estimated
      chartData.push({ month: ["জানু","ফেব্রু","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টে","অক্টো","নভে","ডিসে"][d.getMonth()], sales, profit });
    }

    // Total product count
    const totalProducts = products?.length || 0;

    return NextResponse.json({
      success: true,
      data: { todayTotal, todayOrders, todayProfit: Math.round(todayProfit), monthTotal, totalDue, totalProducts, lowStockItems, recentSales: recentSales || [], chartData }
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json({ success: false, error: "ড্যাশবোর্ড লোড ব্যর্থ" }, { status: 500 });
  }
}
