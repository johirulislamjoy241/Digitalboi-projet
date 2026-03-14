export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req) {
  try {
    const shopId = req.nextUrl.searchParams.get("shopId");
    if (!shopId) return NextResponse.json([]);
    const { data } = await supabaseAdmin.from("notifications")
      .select("*").eq("shop_id", shopId)
      .order("created_at", { ascending:false }).limit(50);
    return NextResponse.json({ success:true, data:data||[] });
  } catch(e) {
    return NextResponse.json({ success:true, data:[] });
  }
}

export async function PATCH(req) {
  try {
    const { id, all, shopId } = await req.json();
    if (all && shopId) {
      await supabaseAdmin.from("notifications").update({is_read:true}).eq("shop_id",shopId);
    } else if (id) {
      await supabaseAdmin.from("notifications").update({is_read:true}).eq("id",id);
    }
    return NextResponse.json({ success:true });
  } catch(e) {
    return NextResponse.json({ success:false });
  }
}

export async function POST(req) {
  try {
    const { shopId, title, message, type, toAll } = await req.json();
    if (!shopId||!title) return NextResponse.json({success:false,error:"shopId ও title দিন"},{status:400});
    await supabaseAdmin.from("notifications").insert({
      shop_id:shopId, type:type||"info", title, message:message||null
    });
    return NextResponse.json({ success:true });
  } catch(e) {
    return NextResponse.json({ success:false, error:e.message },{status:500});
  }
}
