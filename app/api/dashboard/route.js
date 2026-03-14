export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Bangladesh UTC+6
function bdDate(offsetDays = 0) {
  const now = new Date();
  const bd  = new Date(now.getTime() + 6 * 60 * 60 * 1000 + offsetDays * 86400000);
  return bd.toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function GET(req) {
  try {
    const shopId = req.nextUrl.searchParams.get("shopId");
    if (!shopId) return NextResponse.json({ success: false, error: "shopId প্রয়োজন" }, { status: 400 });

    const today      = bdDate(0);
    const monthStart = today.slice(0, 7) + "-01";

    // Today's sales
    const { data: todaySales } = await supabaseAdmin.from("sales")
      .select("total,paid,due,status")
      .eq("shop_id", shopId)
      .gte("created_at", today + "T00:00:00+06:00")
      .lte("created_at", today + "T23:59:59+06:00");

    const todayTotal  = (todaySales || []).reduce((s, x) => s + (+x.total || 0), 0);
    const todayOrders = (todaySales || []).length;
    const todayPaid   = (todaySales || []).reduce((s, x) => s + (+x.paid  || 0), 0);

    // Month sales
    const { data: monthSales } = await supabaseAdmin.from("sales")
      .select("total").eq("shop_id", shopId)
      .gte("created_at", monthStart + "T00:00:00+06:00");
    const monthTotal = (monthSales || []).reduce((s, x) => s + (+x.total || 0), 0);

    // Total due from customers
    const { data: customers } = await supabaseAdmin.from("customers")
      .select("due_amount").eq("shop_id", shopId).gt("due_amount", 0);
    const totalDue = (customers || []).reduce((s, c) => s + (+c.due_amount || 0), 0);

    // Low stock products
    const { data: products } = await supabaseAdmin.from("products")
      .select("id,name,stock,low_stock_alert,unit").eq("shop_id", shopId).eq("is_active", true);
    const lowStockItems = (products || []).filter(p => (+p.stock) <= (+p.low_stock_alert));

    // Recent 5 sales
    const { data: recentSales } = await supabaseAdmin.from("sales")
      .select("id,invoice_id,total,paid,due,payment_method,status,created_at,customers(name)")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(5);

    // 6-month chart data
    const now = new Date(new Date().getTime() + 6 * 60 * 60 * 1000);
    const BD_MONTHS = ["জানু","ফেব্রু","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টে","অক্টো","নভে","ডিসে"];
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01T00:00:00+06:00`;
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const end   = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(lastDay).padStart(2,"0")}T23:59:59+06:00`;

      const { data: ms } = await supabaseAdmin.from("sales")
        .select("total,buy_price_total")
        .eq("shop_id", shopId)
        .gte("created_at", start)
        .lte("created_at", end);

      const sales  = (ms || []).reduce((s, x) => s + (+x.total || 0), 0);
      const profit = Math.round(sales * 0.2); // estimated
      chartData.push({ month: BD_MONTHS[d.getMonth()], sales, profit });
    }

    return NextResponse.json({
      success: true,
      data: {
        todayTotal, todayOrders, todayPaid,
        monthTotal, totalDue,
        lowStockItems: lowStockItems.slice(0, 6),
        recentSales: recentSales || [],
        chartData
      }
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json({ success: false, error: "ড্যাশবোর্ড লোড ব্যর্থ: " + err.message }, { status: 500 });
  }
}
