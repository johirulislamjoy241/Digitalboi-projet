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

// Collect partial due on a sale
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const { amount } = await req.json();
    if (!amount || +amount <= 0) return NextResponse.json({ success: false, error: "পরিমাণ দিন" }, { status: 400 });

    const { data: sale } = await supabaseAdmin.from("sales")
      .select("due,paid,customer_id").eq("id", id).single();
    if (!sale) return NextResponse.json({ success: false, error: "বিক্রয় পাওয়া যায়নি" }, { status: 404 });

    const newDue  = Math.max(0, (+sale.due) - (+amount));
    const newPaid = (+sale.paid) + (+amount);
    await supabaseAdmin.from("sales")
      .update({ due: newDue, paid: newPaid, status: newDue <= 0 ? "paid" : "due" })
      .eq("id", id);

    if (sale.customer_id) {
      const { data: cust } = await supabaseAdmin.from("customers")
        .select("due_amount").eq("id", sale.customer_id).single();
      if (cust) {
        await supabaseAdmin.from("customers")
          .update({ due_amount: Math.max(0, (+cust.due_amount) - (+amount)) })
          .eq("id", sale.customer_id);
      }
    }

    return NextResponse.json({ success: true, newDue, newPaid });
  } catch (err) {
    return NextResponse.json({ success: false, error: "আপডেট ব্যর্থ: " + (err.message || "") }, { status: 500 });
  }
}
