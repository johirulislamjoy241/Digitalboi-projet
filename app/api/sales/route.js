export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateInvoiceId } from "@/lib/helpers";

export async function GET(req) {
  try {
    const { searchParams } = req.nextUrl;
    const shopId     = searchParams.get("shopId");
    const customerId = searchParams.get("customerId");
    const limit      = parseInt(searchParams.get("limit") || "50");
    const offset     = parseInt(searchParams.get("offset") || "0");
    if (!shopId) return NextResponse.json({ success:false, error:"shopId প্রয়োজন" },{status:400});

    let q = supabaseAdmin.from("sales")
      .select("*,customers(name,phone),sale_items(*)", { count:"exact" })
      .eq("shop_id", shopId)
      .order("created_at", { ascending:false })
      .range(offset, offset+limit-1);
    if (customerId) q = q.eq("customer_id", customerId);

    const { data, error, count } = await q;
    if (error) throw error;
    return NextResponse.json({ success:true, data:data||[], total:count||0 });
  } catch(err) {
    return NextResponse.json({ success:false, error:"লোড ব্যর্থ: "+err.message },{status:500});
  }
}

export async function POST(req) {
  try {
    const { shopId, customerId, items, paymentMethod, discountPct, paidAmount, notes } = await req.json();
    if (!shopId||!items?.length)
      return NextResponse.json({success:false,error:"পণ্য নির্বাচন করুন"},{status:400});

    const subtotal = parseFloat(items.reduce((s,i)=>(s+(parseFloat(i.unitPrice)*parseFloat(i.quantity))),0).toFixed(2));
    const discPct  = parseFloat(discountPct||0);
    const discount = parseFloat((subtotal * discPct / 100).toFixed(2));
    const total    = parseFloat((subtotal - discount).toFixed(2));
    const method   = paymentMethod||"নগদ";

    // Precise payment calculation
    let paid, due;
    if (method === "বাকি") {
      paid = 0;
      due  = total;
    } else if (paidAmount !== undefined && paidAmount !== null) {
      paid = parseFloat(parseFloat(paidAmount).toFixed(2));
      due  = parseFloat((total - paid).toFixed(2));
    } else {
      paid = total;
      due  = 0;
    }
    paid = Math.max(0, Math.min(paid, total));
    due  = parseFloat((total - paid).toFixed(2));

    const status    = due <= 0 ? "paid" : paid <= 0 ? "due" : "partial";
    const invoiceId = generateInvoiceId();

    // Insert sale
    const { data:sale, error:saleErr } = await supabaseAdmin.from("sales").insert({
      shop_id:shopId, customer_id:customerId||null, invoice_id:invoiceId,
      subtotal, discount, discount_pct:discPct, total, paid, due,
      payment_method:method, notes:notes||null, status
    }).select().single();
    if (saleErr) throw saleErr;

    // Insert items & deduct stock
    for (const item of items) {
      const qty      = parseFloat(item.quantity);
      const unitP    = parseFloat(item.unitPrice);
      const itemTotal= parseFloat((unitP * qty).toFixed(2));

      await supabaseAdmin.from("sale_items").insert({
        sale_id:sale.id, product_id:item.productId||null,
        product_name:item.name, quantity:qty,
        unit_price:unitP, subtotal:itemTotal
      });

      if (item.productId) {
        const { data:prod } = await supabaseAdmin.from("products")
          .select("stock,name,low_stock_alert").eq("id",item.productId).single();
        if (prod) {
          const newStock = parseFloat(Math.max(0, parseFloat(prod.stock) - qty).toFixed(3));
          await supabaseAdmin.from("products").update({ stock:newStock }).eq("id",item.productId);
        }
      }
    }

    // Update customer stats — precise
    if (customerId) {
      const { data:cust } = await supabaseAdmin.from("customers")
        .select("due_amount,total_purchase,loyalty_points").eq("id",customerId).single();
      if (cust) {
        const newDue   = parseFloat(Math.max(0, parseFloat(cust.due_amount||0) + due).toFixed(2));
        const newTotal = parseFloat((parseFloat(cust.total_purchase||0) + total).toFixed(2));
        const newPts   = (parseInt(cust.loyalty_points)||0) + Math.floor(total/10);
        await supabaseAdmin.from("customers").update({
          due_amount:    newDue,
          total_purchase:newTotal,
          loyalty_points:newPts,
          customer_type: newTotal >= 5000 ? "VIP" : "Regular"
        }).eq("id",customerId);
      }
    }

    // Notifications
    try {
      const notifInserts = [];
      notifInserts.push({
        shop_id:shopId, type:"sale",
        title:"🛒 নতুন বিক্রয়",
        message:`${invoiceId} · মোট: ৳${total.toFixed(2)}${due>0?" · বাকি: ৳"+due.toFixed(2):""}`
      });
      for (const item of items) {
        if (item.productId) {
          const { data:p } = await supabaseAdmin.from("products")
            .select("name,stock,low_stock_alert").eq("id",item.productId).single();
          if (p) {
            if (parseFloat(p.stock)===0) {
              notifInserts.push({ shop_id:shopId, type:"error", title:"❌ স্টক শেষ", message:`${p.name} — স্টক সম্পূর্ণ শেষ!` });
            } else if (parseFloat(p.stock) <= parseFloat(p.low_stock_alert)) {
              notifInserts.push({ shop_id:shopId, type:"warning", title:"⚠️ লো স্টক", message:`${p.name} — মাত্র ${p.stock} বাকি আছে` });
            }
          }
        }
      }
      await supabaseAdmin.from("notifications").insert(notifInserts);
    } catch {}

    return NextResponse.json({ success:true, data:{ ...sale, invoiceId } });
  } catch(err) {
    console.error("Sale POST error:", err);
    return NextResponse.json({ success:false, error:"বিক্রয় ব্যর্থ: "+(err.message||"") },{status:500});
  }
}
