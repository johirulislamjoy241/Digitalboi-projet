import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const allowed = ["name","brand","category_id","sell_price","buy_price","stock","low_stock_alert","unit","barcode","is_active"];
    const updates = {};
    allowed.forEach(k => { if (body[k] !== undefined) updates[k] = body[k]; });
    // Also accept camelCase from frontend
    if (body.sellPrice  !== undefined) updates.sell_price      = +body.sellPrice;
    if (body.buyPrice   !== undefined) updates.buy_price       = +body.buyPrice;
    if (body.categoryId !== undefined) updates.category_id     = body.categoryId || null;
    if (body.lowStockAlert !== undefined) updates.low_stock_alert = +body.lowStockAlert;

    const { data, error } = await supabaseAdmin.from("products")
      .update(updates).eq("id", id).select("*,categories(id,name)").single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: "আপডেট ব্যর্থ: " + (err.message || "") }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await supabaseAdmin.from("products").update({ is_active: false }).eq("id", id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: "মুছতে ব্যর্থ" }, { status: 500 });
  }
}
