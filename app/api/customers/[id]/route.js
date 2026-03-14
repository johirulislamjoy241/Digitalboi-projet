export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin.from("customers").select("*").eq("id",id).single();
    if (error) throw error;
    return NextResponse.json({ success:true, data });
  } catch(err) {
    return NextResponse.json({ success:false, error:"পাওয়া যায়নি" },{status:404});
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const allowed = ["name","phone","address","customer_type","alt_phone","email","nid","dob","gender","reference","notes"];
    const updates = {};
    allowed.forEach(k => { if (body[k] !== undefined) updates[k] = body[k]||null; });
    if (body.name) updates.name = body.name; // name cannot be null

    const { data, error } = await supabaseAdmin.from("customers").update(updates).eq("id",id).select().single();
    if (error) {
      // Fallback: base fields only
      const base = {};
      ["name","phone","address","customer_type"].forEach(k => { if (body[k]!==undefined) base[k]=body[k]; });
      const { data:d2, error:e2 } = await supabaseAdmin.from("customers").update(base).eq("id",id).select().single();
      if (e2) throw e2;
      return NextResponse.json({ success:true, data:d2 });
    }
    return NextResponse.json({ success:true, data });
  } catch(err) {
    return NextResponse.json({ success:false, error:"আপডেট ব্যর্থ: "+err.message },{status:500});
  }
}

// Collect due payment — পাই টু পাই হিসাব
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { amount, paymentMethod, note, shopId } = await req.json();

    if (!amount) return NextResponse.json({success:false,error:"পরিমাণ দিন"},{status:400});
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)||amountNum<=0)
      return NextResponse.json({success:false,error:"পরিমাণ সঠিক নয়"},{status:400});

    const { data:customer } = await supabaseAdmin.from("customers")
      .select("due_amount,name").eq("id",id).single();
    if (!customer) return NextResponse.json({success:false,error:"কাস্টমার পাওয়া যায়নি"},{status:404});

    const currentDue = parseFloat(customer.due_amount)||0;
    if (amountNum>currentDue)
      return NextResponse.json({success:false,error:`বাকির চেয়ে বেশি নিতে পারবেন না। বর্তমান বাকি: ৳${currentDue.toFixed(2)}`},{status:400});

    // Precise decimal calculation
    const newDue = Math.max(0, parseFloat((currentDue - amountNum).toFixed(2)));

    const { error:updateErr } = await supabaseAdmin.from("customers")
      .update({ due_amount:newDue }).eq("id",id);
    if (updateErr) throw updateErr;

    // Log payment
    try {
      await supabaseAdmin.from("due_payments").insert({
        shop_id:shopId, customer_id:id,
        amount:amountNum, payment_method:paymentMethod||"নগদ", note:note||null
      });
    } catch {}

    // Notification
    try {
      const { data:shop } = await supabaseAdmin.from("shops").select("id").eq("id",shopId).single();
      if (shop) {
        await supabaseAdmin.from("notifications").insert({
          shop_id:shopId,
          type:"payment",
          title:`💰 বাকি কালেকশন`,
          message:`${customer.name} থেকে ৳${amountNum.toFixed(2)} কালেক্ট। অবশিষ্ট বাকি: ৳${newDue.toFixed(2)}`
        });
      }
    } catch {}

    return NextResponse.json({ success:true, newDue, collected:amountNum });
  } catch(err) {
    return NextResponse.json({ success:false, error:"পেমেন্ট ব্যর্থ: "+(err.message||"") },{status:500});
  }
}
