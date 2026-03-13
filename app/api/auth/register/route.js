export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { signToken } from "@/lib/jwt";
import { normalizePhone, validateBDPhone } from "@/lib/helpers";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const g = (k) => (formData.get(k) || "").toString().trim();

    const phone      = g("phone");
    const email      = g("email") || null;
    const ownerName  = g("ownerName");
    const bizName    = g("bizName");
    const bizType    = g("bizType") || "ফিজিক্যাল";
    const bizPhone   = g("bizPhone") || null;
    const bizEmail   = g("bizEmail") || null;
    const division   = g("division") || null;
    const district   = g("district") || null;
    const upazila    = g("upazila") || null;
    const postcode   = g("postcode") || null;
    const address    = g("address") || null;
    const lat        = g("lat") ? parseFloat(g("lat")) : null;
    const lng        = g("lng") ? parseFloat(g("lng")) : null;
    const password   = g("password");

    const normalized = normalizePhone(phone);
    if (!normalized || !validateBDPhone(phone))
      return NextResponse.json({ success: false, error: "সঠিক বাংলাদেশি নম্বর দিন" }, { status: 400 });
    if (!ownerName)
      return NextResponse.json({ success: false, error: "মালিকের নাম দিন" }, { status: 400 });
    if (!bizName)
      return NextResponse.json({ success: false, error: "দোকানের নাম দিন" }, { status: 400 });
    if (!password || password.length < 6)
      return NextResponse.json({ success: false, error: "কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন" }, { status: 400 });

    // Check duplicate
    const { data: existing } = await supabaseAdmin.from("users").select("id").eq("phone", normalized).maybeSingle();
    if (existing) return NextResponse.json({ success: false, error: "এই নম্বর ইতিমধ্যে নিবন্ধিত" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const { data: user, error: userErr } = await supabaseAdmin
      .from("users")
      .insert({ phone: normalized, email, name: ownerName, password_hash: passwordHash, is_verified: true, is_active: true, role: "owner" })
      .select("id,name,phone,email")
      .single();
    if (userErr) throw userErr;

    // Create shop
    const { data: shop, error: shopErr } = await supabaseAdmin
      .from("shops")
      .insert({
        owner_id: user.id, name: bizName,
        phone: bizPhone || normalized, email: bizEmail || email,
        biz_type: bizType, division, district, upazila,
        post_code: postcode, address, latitude: lat, longitude: lng,
        plan: "Free", status: "active", is_active: true
      })
      .select("id,name")
      .single();
    if (shopErr) throw shopErr;

    // Default categories
    const defaultCats = ["পানীয়","স্ন্যাকস","গৃহস্থালি","সৌন্দর্য","পোশাক","ইলেকট্রনিক্স","অন্যান্য"];
    await supabaseAdmin.from("categories").insert(defaultCats.map(name => ({ shop_id: shop.id, name, color: "#FF5722" })));

    const token = signToken({ userId: user.id, shopId: shop.id, role: "owner" });
    return NextResponse.json({
      success: true, token,
      user: { id: user.id, name: user.name, phone: user.phone, email: user.email, shopId: shop.id, shopName: shop.name, role: "owner" }
    });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ success: false, error: "রেজিস্ট্রেশন ব্যর্থ: " + (err.message || "") }, { status: 500 });
  }
}
