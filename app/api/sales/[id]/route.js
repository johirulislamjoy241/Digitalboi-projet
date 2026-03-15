import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin.from("sales")
      .select("*,customers(name,phone),sale_items(*),shops(name,address,phone)")
      .eq("id", id).single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: "লোড ব্যর্থ" }, { status: 500 });
  }
}

// বাকি কালেক্ট করুন
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const { amount, method } = await req.json();
    if (!amount || +amount <= 0)
      return NextResponse.json({ success: false, error: "পরিমাণ দিন" }, { status: 400 });

    const { data: sale } = await supabaseAdmin.from("sales")
      .select("due, paid, total, customer_id, shop_id").eq("id", id).single();
    if (!sale)
      return NextResponse.json({ success: false, error: "বিক্রয় পাওয়া যায়নি" }, { status: 404 });

    const collectAmt = Math.min(+amount, +sale.due); // বাকির বেশি নেওয়া যাবে না
    const newDue  = Math.max(0, (+sale.due) - collectAmt);
    const newPaid = (+sale.paid) + collectAmt;
    const newStatus = newDue <= 0 ? "paid" : "partial";

    // sale আপডেট
    await supabaseAdmin.from("sales")
      .update({ due: newDue, paid: newPaid, status: newStatus })
      .eq("id", id);

    // customer due_amount sync
    if (sale.customer_id) {
      const { data: cust } = await supabaseAdmin.from("customers")
        .select("due_amount").eq("id", sale.customer_id).single();
      if (cust) {
        const newCustDue = Math.max(0, (+cust.due_amount) - collectAmt);
        await supabaseAdmin.from("customers")
          .update({ due_amount: newCustDue }).eq("id", sale.customer_id);
      }
    }

    // payment log
    if (sale.shop_id) {
      await supabaseAdmin.from("due_payments").insert({
        shop_id:        sale.shop_id,
        customer_id:    sale.customer_id || null,
        amount:         collectAmt,
        payment_method: method || "নগদ",
        note:           `Sale #${id} বাকি আদায়`,
      }).catch(() => {}); // ব্যর্থ হলেও main flow চলবে
    }

    return NextResponse.json({ success: true, newDue, newPaid, newStatus });
  } catch (err) {
    return NextResponse.json({ success: false, error: "আপডেট ব্যর্থ: " + (err.message || "") }, { status: 500 });
  }
}
