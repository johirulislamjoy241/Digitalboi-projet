import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// কাস্টমার তথ্য আপডেট
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const allowed = ["name", "phone", "address", "customer_type", "notes", "email", "alt_phone"];
    const updates = {};
    allowed.forEach(k => { if (body[k] !== undefined) updates[k] = body[k]; });

    const { data, error } = await supabaseAdmin.from("customers")
      .update(updates).eq("id", id).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: "আপডেট ব্যর্থ" }, { status: 500 });
  }
}

// কাস্টমার থেকে বাকি কালেক্ট (due_payments লগ + sales sync)
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { amount, paymentMethod, note, shopId } = await req.json();
    if (!amount || +amount <= 0)
      return NextResponse.json({ success: false, error: "পরিমাণ দিন" }, { status: 400 });

    const { data: customer } = await supabaseAdmin.from("customers")
      .select("due_amount, name").eq("id", id).single();
    if (!customer)
      return NextResponse.json({ success: false, error: "কাস্টমার পাওয়া যায়নি" }, { status: 404 });

    let remaining = +amount;
    const newCustDue = Math.max(0, (+customer.due_amount) - remaining);

    // customers due_amount আপডেট
    await supabaseAdmin.from("customers")
      .update({ due_amount: newCustDue }).eq("id", id);

    // সংশ্লিষ্ট sales গুলো থেকে পুরনো বাকি কমাও (latest first)
    const { data: dueSales } = await supabaseAdmin.from("sales")
      .select("id, due, paid")
      .eq("customer_id", id)
      .gt("due", 0)
      .order("created_at", { ascending: false });

    for (const sale of (dueSales || [])) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, +sale.due);
      const newDue  = Math.max(0, (+sale.due) - take);
      const newPaid = (+sale.paid) + take;
      await supabaseAdmin.from("sales").update({
        due: newDue,
        paid: newPaid,
        status: newDue <= 0 ? "paid" : "partial",
      }).eq("id", sale.id);
      remaining -= take;
    }

    // due_payments লগ
    await supabaseAdmin.from("due_payments").insert({
      shop_id:        shopId,
      customer_id:    id,
      amount:         +amount,
      payment_method: paymentMethod || "নগদ",
      note:           note || null,
    });

    return NextResponse.json({ success: true, newDue: newCustDue });
  } catch (err) {
    return NextResponse.json({ success: false, error: "পেমেন্ট ব্যর্থ: " + (err.message || "") }, { status: 500 });
  }
}
