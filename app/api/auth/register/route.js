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
    const nid        = g("nid") || null;
    const ownerDob   = g("ownerDob") || null;
    const ownerGender= g("ownerGender") || "পুরুষ";
    const bizName    = g("bizName");
    const bizType    = g("bizType") || "ফিজিক্যাল";
    const bizCategory= g("bizCategory") || null;
    const bizPhone   = g("bizPhone") || null;
    const bizEmail   = g("bizEmail") || null;
    const bizWebsite = g("bizWebsite") || null;
    const bizSocial  = g("bizSocial") || null;
    const tradeLicense = g("tradeLicense") || null;
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

    // Check duplicate phone
    const { data: existing } = await supabaseAdmin.from("users").select("id").eq("phone", normalized).maybeSingle();
    if (existing) return NextResponse.json({ success: false, error: "এই মোবাইল নম্বরে ইতিমধ্যে অ্যাকাউন্ট আছে। অন্য নম্বর ব্যবহার করুন।" }, { status: 409 });

    // Check duplicate email
    if (email) {
      const { data: existingEmail } = await supabaseAdmin.from("users").select("id").eq("email", email).maybeSingle();
      if (existingEmail) return NextResponse.json({ success: false, error: "এই ইমেইলে ইতিমধ্যে অ্যাকাউন্ট আছে। অন্য ইমেইল ব্যবহার করুন।" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const userInsert = { phone: normalized, email, name: ownerName, password_hash: passwordHash, is_verified: true, is_active: true, role: "owner" };
    // Add extra cols if they exist (migration v11)
    if (nid)        userInsert.nid    = nid;
    if (ownerDob)   userInsert.dob    = ownerDob;
    if (ownerGender)userInsert.gender = ownerGender;

    const { data: user, error: userErr } = await supabaseAdmin
      .from("users")
      .insert(userInsert)
      .select("id,name,phone,email")
      .single();
    if (userErr) throw userErr;

    // Create shop
    const shopInsert = {
      owner_id: user.id, name: bizName,
      phone: bizPhone || normalized, email: bizEmail || email,
      biz_type: bizType, division, district, upazila,
      post_code: postcode, address, latitude: lat, longitude: lng,
      plan: "Free", status: "active", is_active: true
    };
    // Extra cols (migration v11)
    if (bizCategory)   shopInsert.biz_category   = bizCategory;
    if (bizWebsite)    shopInsert.website         = bizWebsite;
    if (bizSocial)     shopInsert.social_link     = bizSocial;
    if (tradeLicense)  shopInsert.trade_license   = tradeLicense;

    const { data: shop, error: shopErr } = await supabaseAdmin
      .from("shops")
      .insert(shopInsert)
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
    let msg = err.message || "";
    if (msg.includes("users_email_key") || msg.includes("duplicate key") && msg.includes("email"))
      msg = "এই ইমেইলে ইতিমধ্যে অ্যাকাউন্ট আছে।";
    else if (msg.includes("users_phone_key") || msg.includes("duplicate key") && msg.includes("phone"))
      msg = "এই মোবাইল নম্বরে ইতিমধ্যে অ্যাকাউন্ট আছে।";
    else if (msg.includes("duplicate key"))
      msg = "এই তথ্য ইতিমধ্যে ব্যবহৃত। অন্য তথ্য দিয়ে চেষ্টা করুন।";
    return NextResponse.json({ success: false, error: "রেজিস্ট্রেশন ব্যর্থ: " + msg }, { status: 500 });
  }
}
