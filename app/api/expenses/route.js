export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req) {
  try {
    const shopId = req.nextUrl.searchParams.get("shopId");
    if (!shopId) return NextResponse.json({success:false,error:"shopId প্রয়োজন"},{status:400});
    const { data, error } = await supabaseAdmin.from("expenses")
      .select("*").eq("shop_id",shopId).eq("is_deleted",false)
      .order("created_at",{ascending:false}).limit(100);
    if (error) {
      // Fallback if is_deleted column doesn't exist yet
      const { data:d2, error:e2 } = await supabaseAdmin.from("expenses")
        .select("*").eq("shop_id",shopId)
        .order("created_at",{ascending:false}).limit(100);
      if (e2) throw e2;
      return NextResponse.json({ success:true, data:d2||[] });
    }
    return NextResponse.json({ success:true, data:data||[] });
  } catch(err) {
    return NextResponse.json({ success:false, error:"লোড ব্যর্থ: "+err.message },{status:500});
  }
}

export async function POST(req) {
  try {
    const { shopId, category, amount, note, expenseDate } = await req.json();
    if (!shopId||!amount) return NextResponse.json({success:false,error:"পরিমাণ দিন"},{status:400});
    if (+amount<=0) return NextResponse.json({success:false,error:"পরিমাণ ০ এর বেশি হতে হবে"},{status:400});

    const today = new Date().toISOString().slice(0,10);
    const { data, error } = await supabaseAdmin.from("expenses").insert({
      shop_id:shopId, category:category||"অন্যান্য",
      amount:+amount, note:note||null,
      expense_date:expenseDate||today,
    }).select().single();
    if (error) {
      // Fallback without expense_date
      const { data:d2, error:e2 } = await supabaseAdmin.from("expenses").insert({
        shop_id:shopId, category:category||"অন্যান্য", amount:+amount, note:note||null,
      }).select().single();
      if (e2) throw e2;
      return NextResponse.json({ success:true, data:d2 });
    }
    return NextResponse.json({ success:true, data });
  } catch(err) {
    return NextResponse.json({ success:false, error:"যোগ ব্যর্থ: "+(err.message||"") },{status:500});
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({success:false,error:"id দিন"},{status:400});
    // Soft delete
    try {
      await supabaseAdmin.from("expenses").update({is_deleted:true}).eq("id",id);
    } catch {
      await supabaseAdmin.from("expenses").delete().eq("id",id);
    }
    return NextResponse.json({ success:true });
  } catch(err) {
    return NextResponse.json({ success:false, error:"মুছতে ব্যর্থ" },{status:500});
  }
}
