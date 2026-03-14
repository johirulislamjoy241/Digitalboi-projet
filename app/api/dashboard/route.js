export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Bangladesh UTC+6 date
function bdNow() {
  return new Date(new Date().getTime() + 6 * 60 * 60 * 1000);
}
function bdDateStr(d) {
  return d.toISOString().slice(0, 10);
}

export async function GET(req) {
  try {
    const shopId = req.nextUrl.searchParams.get("shopId");
    if (!shopId) return NextResponse.json({ success:false, error:"shopId প্রয়োজন" }, { status:400 });

    const now        = bdNow();
    const today      = bdDateStr(now);
    const monthStart = today.slice(0, 7) + "-01";

    // Today's sales — use date range that covers full BD day
    const todayStart = today + "T00:00:00.000Z";
    const todayEnd   = today + "T17:59:59.999Z"; // BD midnight = UTC 18:00 prev day, so +1 day end

    // Better approach: filter by date string
    const { data: todaySales } = await supabaseAdmin.from("sales")
      .select("total,paid,due,status")
      .eq("shop_id", shopId)
      .gte("created_at", today + "T00:00:00+06:00")
      .lt("created_at",  today + "T23:59:59+06:00");

    const todayTotal  = (todaySales||[]).reduce((s,x) => s + (parseFloat(x.total)||0), 0);
    const todayOrders = (todaySales||[]).length;
    const todayPaid   = (todaySales||[]).reduce((s,x) => s + (parseFloat(x.paid)||0), 0);

    // Month sales
    const { data: monthSales } = await supabaseAdmin.from("sales")
      .select("total")
      .eq("shop_id", shopId)
      .gte("created_at", monthStart + "T00:00:00+06:00");
    const monthTotal = (monthSales||[]).reduce((s,x) => s + (parseFloat(x.total)||0), 0);

    // Total due from customers
    const { data: customers } = await supabaseAdmin.from("customers")
      .select("due_amount").eq("shop_id", shopId).gt("due_amount", 0);
    const totalDue = (customers||[]).reduce((s,c) => s + (parseFloat(c.due_amount)||0), 0);

    // Low stock
    const { data: products } = await supabaseAdmin.from("products")
      .select("id,name,stock,low_stock_alert,unit").eq("shop_id", shopId).eq("is_active", true);
    const lowStockItems = (products||[]).filter(p => parseFloat(p.stock) <= parseFloat(p.low_stock_alert));

    // Recent 5 sales
    const { data: recentSales } = await supabaseAdmin.from("sales")
      .select("id,invoice_id,total,paid,due,payment_method,status,created_at,customers(name)")
      .eq("shop_id", shopId)
      .order("created_at", { ascending:false })
      .limit(5);

    // 6-month chart
    const BD_MONTHS = ["জানু","ফেব্রু","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টে","অক্টো","নভে","ডিসে"];
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yr    = d.getFullYear();
      const mo    = String(d.getMonth()+1).padStart(2,"0");
      const lastD = new Date(yr, d.getMonth()+1, 0).getDate();
      const { data: ms } = await supabaseAdmin.from("sales")
        .select("total")
        .eq("shop_id", shopId)
        .gte("created_at", `${yr}-${mo}-01T00:00:00+06:00`)
        .lte("created_at", `${yr}-${mo}-${String(lastD).padStart(2,"0")}T23:59:59+06:00`);
      const sales  = (ms||[]).reduce((s,x) => s + (parseFloat(x.total)||0), 0);
      const profit = parseFloat((sales * 0.2).toFixed(2));
      chartData.push({ month:BD_MONTHS[d.getMonth()], sales, profit });
    }

    return NextResponse.json({
      success:true,
      data:{ todayTotal, todayOrders, todayPaid, monthTotal, totalDue, lowStockItems:lowStockItems.slice(0,6), recentSales:recentSales||[], chartData }
    });
  } catch(err) {
    console.error("Dashboard error:", err);
    return NextResponse.json({ success:false, error:"ড্যাশবোর্ড লোড ব্যর্থ: "+err.message }, { status:500 });
  }
}
