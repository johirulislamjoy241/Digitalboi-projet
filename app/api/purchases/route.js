import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateInvoiceId } from "@/lib/helpers";

export async function GET(req) {
  try {
    const shopId = req.nextUrl.searchParams.get("shopId");
    if (!shopId) return NextResponse.json({ success: false, error: "shopId প্রয়োজন" }, { status: 400 });
    const { data, error } = await supabaseAdmin.from("purchases")
      .select("*,suppliers(name),purchase_items(*)")
      .eq("shop_id", shopId).order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err) {
    return NextResponse.json({ success: false, error: "লোড ব্যর্থ" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { shopId, supplierId, items, paymentMethod, notes } = await req.json();
    if (!shopId || !items?.length) return NextResponse.json({ success: false, error: "তথ্য অসম্পূর্ণ" }, { status: 400 });

    const total     = items.reduce((s, i) => s + (+i.unitCost * +i.quantity), 0);
    const method    = paymentMethod || "নগদ";
    const paid      = method === "বাকি" ? 0 : total;
    const due       = total - paid;
    const invoiceId = generateInvoiceId();

    const { data: purchase, error: pErr } = await supabaseAdmin.from("purchases").insert({
      shop_id: shopId, supplier_id: supplierId || null, invoice_id: invoiceId,
      total, paid, due, payment_method: method, notes: notes || null
    }).select().single();
    if (pErr) throw pErr;

    for (const item of items) {
      const sub = (+item.unitCost) * (+item.quantity);
      await supabaseAdmin.from("purchase_items").insert({
        purchase_id: purchase.id, product_id: item.productId || null,
        product_name: item.name, quantity: +item.quantity,
        unit_cost: +item.unitCost, subtotal: sub
      });
      if (item.productId) {
        const { data: prod } = await supabaseAdmin.from("products")
          .select("stock").eq("id", item.productId).single();
        if (prod) {
          await supabaseAdmin.from("products")
            .update({ stock: (+prod.stock) + (+item.quantity), buy_price: +item.unitCost })
            .eq("id", item.productId);
        }
      }
    }

    if (supplierId && due > 0) {
      const { data: sup } = await supabaseAdmin.from("suppliers")
        .select("due_amount,total_purchase").eq("id", supplierId).single();
      if (sup) {
        await supabaseAdmin.from("suppliers").update({
          due_amount:     (+sup.due_amount || 0) + due,
          total_purchase: (+sup.total_purchase || 0) + total
        }).eq("id", supplierId);
      }
    }

    return NextResponse.json({ success: true, data: purchase });
  } catch (err) {
    console.error("Purchase POST error:", err);
    return NextResponse.json({ success: false, error: "ক্রয় ব্যর্থ: " + (err.message || "") }, { status: 500 });
  }
}
