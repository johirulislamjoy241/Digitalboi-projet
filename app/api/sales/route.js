import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateInvoiceId } from "@/lib/helpers";

export async function GET(req) {
  try {
    const { searchParams } = req.nextUrl;
    const shopId = searchParams.get("shopId");
    const limit  = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    if (!shopId) return NextResponse.json({ success: false, error: "shopId প্রয়োজন" }, { status: 400 });

    const { data, error, count } = await supabaseAdmin.from("sales")
      .select("*,customers(name,phone),sale_items(*)", { count: "exact" })
      .eq("shop_id", shopId).order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [], total: count || 0 });
  } catch (err) {
    return NextResponse.json({ success: false, error: "লোড ব্যর্থ" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { shopId, customerId, items, paymentMethod, discountPct, notes } = await req.json();
    if (!shopId || !items?.length)
      return NextResponse.json({ success: false, error: "পণ্য নির্বাচন করুন" }, { status: 400 });

    const subtotal  = items.reduce((s, i) => s + (+i.unitPrice * +i.quantity), 0);
    const discPct   = +(discountPct || 0);
    const discount  = Math.floor(subtotal * discPct / 100);
    const total     = subtotal - discount;
    const method    = paymentMethod || "নগদ";
    const paid      = method === "বাকি" ? 0 : total;
    const due       = total - paid;
    const invoiceId = generateInvoiceId();

    // Insert sale
    const { data: sale, error: saleErr } = await supabaseAdmin.from("sales").insert({
      shop_id: shopId, customer_id: customerId || null, invoice_id: invoiceId,
      subtotal, discount, discount_pct: discPct, total, paid, due,
      payment_method: method, notes: notes || null,
      status: due > 0 ? "due" : "paid"
    }).select().single();
    if (saleErr) throw saleErr;

    // Insert items & deduct stock
    for (const item of items) {
      const itemTotal = (+item.unitPrice) * (+item.quantity);
      await supabaseAdmin.from("sale_items").insert({
        sale_id: sale.id, product_id: item.productId || null,
        product_name: item.name, quantity: +item.quantity,
        unit_price: +item.unitPrice, subtotal: itemTotal
      });
      if (item.productId) {
        const { data: prod } = await supabaseAdmin.from("products")
          .select("stock").eq("id", item.productId).single();
        if (prod) {
          await supabaseAdmin.from("products")
            .update({ stock: Math.max(0, (+prod.stock) - (+item.quantity)) })
            .eq("id", item.productId);
        }
      }
    }

    // Update customer stats
    if (customerId) {
      const { data: cust } = await supabaseAdmin.from("customers")
        .select("due_amount,total_purchase,loyalty_points").eq("id", customerId).single();
      if (cust) {
        const newTotal = (+cust.total_purchase || 0) + total;
        await supabaseAdmin.from("customers").update({
          due_amount:     Math.max(0, (+cust.due_amount || 0) + due),
          total_purchase: newTotal,
          loyalty_points: (+cust.loyalty_points || 0) + Math.floor(total / 10),
          customer_type:  newTotal >= 5000 ? "VIP" : "Regular"
        }).eq("id", customerId);
      }
    }

    return NextResponse.json({ success: true, data: { ...sale, invoiceId } });
  } catch (err) {
    console.error("Sale POST error:", err);
    return NextResponse.json({ success: false, error: "বিক্রয় ব্যর্থ: " + (err.message || "") }, { status: 500 });
  }
}
