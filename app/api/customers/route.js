export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = req.nextUrl;
    const shopId = searchParams.get("shopId");
    const search = searchParams.get("search") || "";
    if (!shopId) return NextResponse.json({ success: false, error: "shopId প্রয়োজন" }, { status: 400 });

    let q = supabaseAdmin.from("customers").select("*").eq("shop_id", shopId).order("name");
    if (search) q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);

    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err) {
    return NextResponse.json({ success: false, error: "লোড ব্যর্থ" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { shopId, name, phone, address } = await req.json();
    if (!shopId || !name) return NextResponse.json({ success: false, error: "shopId ও নাম দিন" }, { status: 400 });

    const { data, error } = await supabaseAdmin.from("customers")
      .insert({ shop_id: shopId, name, phone: phone || null, address: address || null })
      .select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: "যোগ ব্যর্থ: " + (err.message || "") }, { status: 500 });
  }
}
