export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req) {
  const shopId = req.nextUrl.searchParams.get("shopId");
  if (!shopId) return NextResponse.json({ success: true, data: [] });
  const { data, error } = await supabaseAdmin.from("categories")
    .select("*").eq("shop_id", shopId).order("name");
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: data || [] });
}

export async function POST(req) {
  try {
    const { shopId, name, color } = await req.json();
    if (!shopId || !name) return NextResponse.json({ success: false, error: "shopId ও নাম দিন" }, { status: 400 });
    const { data, error } = await supabaseAdmin.from("categories")
      .insert({ shop_id: shopId, name, color: color || "#FF5722" })
      .select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: "যোগ ব্যর্থ: " + (err.message || "") }, { status: 500 });
  }
}
