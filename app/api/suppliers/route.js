import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req) {
  try {
    const shopId = req.nextUrl.searchParams.get("shopId");
    if (!shopId) return NextResponse.json({ success: false, error: "shopId প্রয়োজন" }, { status: 400 });
    const { data, error } = await supabaseAdmin.from("suppliers")
      .select("*").eq("shop_id", shopId).eq("is_active", true).order("name");
    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err) {
    return NextResponse.json({ success: false, error: "লোড ব্যর্থ" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { shopId, name, phone, email, address } = await req.json();
    if (!shopId || !name) return NextResponse.json({ success: false, error: "shopId ও নাম দিন" }, { status: 400 });
    const { data, error } = await supabaseAdmin.from("suppliers")
      .insert({ shop_id: shopId, name, phone: phone || null, email: email || null, address: address || null })
      .select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: "যোগ ব্যর্থ: " + (err.message || "") }, { status: 500 });
  }
}
