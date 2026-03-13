import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req) {
  try {
    const shopId = req.nextUrl.searchParams.get("shopId");
    if (!shopId) return NextResponse.json({ success: false, error: "shopId প্রয়োজন" }, { status: 400 });
    const { data, error } = await supabaseAdmin.from("expenses")
      .select("*").eq("shop_id", shopId).order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err) {
    return NextResponse.json({ success: false, error: "লোড ব্যর্থ" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { shopId, category, amount, note } = await req.json();
    if (!shopId || !amount) return NextResponse.json({ success: false, error: "shopId ও পরিমাণ দিন" }, { status: 400 });
    const { data, error } = await supabaseAdmin.from("expenses")
      .insert({ shop_id: shopId, category: category || "অন্যান্য", amount: +amount, note: note || null })
      .select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: "যোগ ব্যর্থ: " + (err.message || "") }, { status: 500 });
  }
}
