import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req) {
  try {
    const shopId = req.nextUrl.searchParams.get("shopId");
    if (!shopId) return NextResponse.json({ success: false, error: "shopId প্রয়োজন" }, { status: 400 });

    const now   = new Date();
    // Bangladesh timezone: UTC+6
    const bdNow  = new Date(now.getTime() + 6 * 3600 * 1000);
    const today  = bdNow.toISOString().slice(0, 10);
    const monthStart = today.slice(0, 7) + "-01";

    // ── আজকের বিক্রয় ──
    const { data: todaySales } = await supabaseAdmin.from("sales")
      .select("total, paid, due, sale_items(quantity, unit_price, products(buy_price))")
      .eq("shop_id", shopId)
      .gte("created_at", today + "T00:00:00+06:00")
      .lte("created_at", today + "T23:59:59+06:00");

    // fallback UTC
    const { data: todaySalesUTC } = !todaySales?.length
      ? await supabaseAdmin.from("sales")
          .select("total, paid, due, sale_items(quantity, unit_price, products(buy_price))")
          .eq("shop_id", shopId)
          .gte("created_at", today + "T00:00:00.000Z")
          .lte("created_at", today + "T23:59:59.999Z")
      : { data: null };

    const ts = todaySales?.length ? todaySales : (todaySalesUTC || []);
    const todayTotal  = ts.reduce((s, x) => s + (+x.total || 0), 0);
    const todayOrders = ts.length;
    const todayDue    = ts.reduce((s, x) => s + (+x.due || 0), 0);

    // আজকের লাভ
    let todayProfit = 0;
    ts.forEach(s => {
      (s.sale_items || []).forEach(i => {
        const buy = Number(i.products?.buy_price || 0);
        todayProfit += (Number(i.unit_price) - buy) * Number(i.quantity);
      });
    });

    // ── এই মাসের বিক্রয় ──
    const { data: monthSales } = await supabaseAdmin.from("sales")
      .select("total").eq("shop_id", shopId)
      .gte("created_at", monthStart + "T00:00:00.000Z");
    const monthTotal = (monthSales || []).reduce((s, x) => s + (+x.total || 0), 0);

    // ── মোট বাকি (sales.due থেকে — সবচেয়ে accurate) ──
    const { data: dueSales } = await supabaseAdmin.from("sales")
      .select("due").eq("shop_id", shopId).gt("due", 0);
    const totalDue = (dueSales || []).reduce((s, x) => s + (+x.due || 0), 0);

    // ── বাকি বিক্রির সংখ্যা ──
    const { count: dueCount } = await supabaseAdmin.from("sales")
      .select("id", { count: "exact", head: true })
      .eq("shop_id", shopId).gt("due", 0);

    // ── পণ্য ──
    const { data: products } = await supabaseAdmin.from("products")
      .select("id, name, stock, low_stock_alert, unit")
      .eq("shop_id", shopId).eq("is_active", true);

    const allProducts  = products || [];
    const lowStockItems = allProducts.filter(p => (+p.stock) <= (+p.low_stock_alert));
    const totalProducts = allProducts.length;

    // ── সাম্প্রতিক ৫টি বিক্রয় ──
    const { data: recentSales } = await supabaseAdmin.from("sales")
      .select("id, invoice_id, total, paid, due, payment_method, status, created_at, customers(name)")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false }).limit(5);

    // ── ৬ মাসের চার্ট ──
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = d.toISOString().slice(0, 7) + "-01";
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);

      const { data: ms } = await supabaseAdmin.from("sales")
        .select("total, sale_items(quantity, unit_price, products(buy_price))")
        .eq("shop_id", shopId)
        .gte("created_at", start + "T00:00:00.000Z")
        .lte("created_at", end + "T23:59:59.999Z");

      const sales = (ms || []).reduce((s, x) => s + (+x.total || 0), 0);
      let profit  = 0;
      (ms || []).forEach(s => {
        (s.sale_items || []).forEach(item => {
          const buy = Number(item.products?.buy_price || 0);
          profit += (Number(item.unit_price) - buy) * Number(item.quantity);
        });
      });

      const MONTHS = ["জানু","ফেব্রু","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টে","অক্টো","নভে","ডিসে"];
      chartData.push({ month: MONTHS[d.getMonth()], sales: Math.round(sales), profit: Math.round(profit) });
    }

    return NextResponse.json({
      success: true,
      data: {
        todayTotal:   Math.round(todayTotal),
        todayOrders,
        todayProfit:  Math.round(todayProfit),
        todayDue:     Math.round(todayDue),
        monthTotal:   Math.round(monthTotal),
        totalDue:     Math.round(totalDue),
        dueCount:     dueCount || 0,
        totalProducts,
        lowStockItems,
        recentSales:  recentSales || [],
        chartData,
      }
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
