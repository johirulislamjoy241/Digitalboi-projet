import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const [{ data: shops }, { data: users }, { data: sales }] = await Promise.all([
      supabaseAdmin.from("shops").select("*,users(name,phone)").order("created_at", { ascending: false }),
      supabaseAdmin.from("users").select("id,name,phone,email,created_at,is_active,role").order("created_at", { ascending: false }).limit(100),
      supabaseAdmin.from("sales").select("total").limit(500),
    ]);
    const totalRevenue = sales?.reduce((s, x) => s + (+x.total || 0), 0) || 0;
    return NextResponse.json({
      success: true,
      data: {
        shops: shops || [], users: users || [], totalRevenue,
        totalShops:  shops?.length || 0,
        activeShops: shops?.filter(s => s.status === "active").length || 0,
      }
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: "লোড ব্যর্থ" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { shopId, action } = await req.json();
    if (!shopId || !action) return NextResponse.json({ success: false, error: "shopId ও action দিন" }, { status: 400 });

    if (action === "approve")
      await supabaseAdmin.from("shops").update({ status: "active", is_active: true }).eq("id", shopId);
    else if (action === "block")
      await supabaseAdmin.from("shops").update({ status: "blocked", is_active: false }).eq("id", shopId);
    else if (action === "unblock")
      await supabaseAdmin.from("shops").update({ status: "active", is_active: true }).eq("id", shopId);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: "আপডেট ব্যর্থ" }, { status: 500 });
  }
}
