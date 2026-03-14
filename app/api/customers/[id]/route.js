export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin.from("customers").select("*").eq("id", id).single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: "পাওয়া যায়নি" }, { status: 404 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    // Support all biodata fields
    const allowed = ["name","phone","address","customer_type"];
    const updates = {};
    allowed.forEach(k => { if (body[k] !== undefined) updates[k] = body[k]; });
    // Extra fields — stored in existing columns if present, otherwise ignored gracefully
    const extra = ["alt_phone","email","nid","dob","gender","reference","notes"];
    extra.forEach(k => { if (body[k] !== undefined) updates[k] = body[k] || null; });

    const { data, error } = await supabaseAdmin.from("customers")
      .update(updates).eq("id", id).select().single();
    if (error) {
      // If column doesn't exist, retry with only base fields
      const baseUpdates = {};
      allowed.forEach(k => { if (body[k] !== undefined) baseUpdates[k] = body[k]; });
      const { data: d2, error: e2 } = await supabaseAdmin.from("customers")
        .update(baseUpdates).eq("id", id).select().single();
      if (e2) throw e2;
      return NextResponse.json({ success: true, data: d2 });
    }
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: "আপডেট ব্যর্থ: " + err.message }, { status: 500 });
  }
}

// Collect due payment
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { amount, paymentMethod, note, shopId } = await req.json();
    if (!amount || +amount <= 0) return NextResponse.json({ success: false, error: "পরিমাণ দিন" }, { status: 400 });

    const { data: customer } = await supabaseAdmin.from("customers")
      .select("due_amount").eq("id", id).single();
    if (!customer) return NextResponse.json({ success: false, error: "কাস্টমার পাওয়া যায়নি" }, { status: 404 });

    const newDue = Math.max(0, (+customer.due_amount) - (+amount));
    await supabaseAdmin.from("customers").update({ due_amount: newDue }).eq("id", id);

    // Try to log due payment (table may not exist in all setups)
    try {
      await supabaseAdmin.from("due_payments").insert({
        shop_id: shopId, customer_id: id,
        amount: +amount, payment_method: paymentMethod || "নগদ", note: note || null
      });
    } catch {}

    return NextResponse.json({ success: true, newDue });
  } catch (err) {
    return NextResponse.json({ success: false, error: "পেমেন্ট ব্যর্থ: " + (err.message || "") }, { status: 500 });
  }
}
