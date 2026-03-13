export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  if (!auth.shopId) return NextResponse.json({ error:"দোকান নেই" }, { status:404 });

  const { data, error } = await supabaseAdmin.from("shops")
    .select("*").eq("id", auth.shopId).maybeSingle();

  if (error || !data) return NextResponse.json({ error:"দোকান পাওয়া যায়নি" }, { status:404 });
  return NextResponse.json({ success:true, data });
}

export async function PATCH(req) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  if (!auth.shopId) return NextResponse.json({ error:"দোকান নেই" }, { status:404 });
  try {
    const body = await req.json();
    const update = {};
    // DB schema অনুযায়ী সঠিক column names
    if (body.name      !== undefined) update.name      = body.name;
    if (body.phone     !== undefined) update.phone     = body.phone;
    if (body.email     !== undefined) update.email     = body.email;
    if (body.biz_type  !== undefined) update.biz_type  = body.biz_type;
    if (body.division  !== undefined) update.division  = body.division;
    if (body.district  !== undefined) update.district  = body.district;
    if (body.upazila   !== undefined) update.upazila   = body.upazila;
    if (body.post_code !== undefined) update.post_code = body.post_code;
    if (body.address   !== undefined) update.address   = body.address;
    if (body.logo_url  !== undefined) update.logo_url  = body.logo_url;

    // Legacy field name support
    if (body.shop_name  !== undefined) update.name     = body.shop_name;
    if (body.shop_logo  !== undefined) update.logo_url = body.shop_logo;

    if (Object.keys(update).length === 0)
      return NextResponse.json({ error:"কোনো আপডেট ডেটা নেই" }, { status:400 });

    const { data, error } = await supabaseAdmin.from("shops")
      .update(update).eq("id", auth.shopId).select().single();

    if (error) throw error;
    return NextResponse.json({ success:true, data });
  } catch(e) {
    console.error("Shop PATCH error:", e);
    return NextResponse.json({ error:e.message }, { status:500 });
  }
}
