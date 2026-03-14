export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = req.nextUrl;
    const shopId = searchParams.get("shopId");
    const search = searchParams.get("search") || "";
    const catId  = searchParams.get("categoryId") || "";
    if (!shopId) return NextResponse.json({ success:false, error:"shopId প্রয়োজন" },{status:400});

    let q = supabaseAdmin.from("products")
      .select("*,categories(id,name),suppliers(id,name)")
      .eq("shop_id", shopId).eq("is_active", true).order("name");
    if (search) q = q.or(`name.ilike.%${search}%,barcode.ilike.%${search}%`);
    if (catId)  q = q.eq("category_id", catId);
    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json({ success:true, data: data||[] });
  } catch(err) {
    return NextResponse.json({ success:false, error:"পণ্য লোড ব্যর্থ: "+err.message },{status:500});
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { shopId, name, brand, description, categoryId, supplierId, sellPrice, buyPrice, stock, lowStockAlert, unit, barcode, expiryDate } = body;
    if (!shopId||!name)    return NextResponse.json({success:false,error:"shopId ও নাম দিন"},{status:400});
    if (!sellPrice||+sellPrice<=0) return NextResponse.json({success:false,error:"বিক্রয় মূল্য দিন"},{status:400});

    const bc = barcode || ("890"+Math.floor(Math.random()*10000000000).toString().padStart(10,"0"));
    const stockVal = parseFloat(stock||0);
    if (isNaN(stockVal)||stockVal<0) return NextResponse.json({success:false,error:"স্টক সংখ্যা সঠিক নয়"},{status:400});

    const { data, error } = await supabaseAdmin.from("products").insert({
      shop_id:shopId, name, brand:brand||null, description:description||null,
      category_id:categoryId||null, supplier_id:supplierId||null,
      sell_price:+sellPrice, buy_price:+(buyPrice||0),
      stock:stockVal, low_stock_alert:+(lowStockAlert||5),
      unit:unit||"পিস", barcode:bc,
      expiry_date:expiryDate||null,
      qr_code:`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DIGIBOI|${bc}|${encodeURIComponent(name)}`,
      is_active:true
    }).select("*,categories(id,name),suppliers(id,name)").single();
    if (error) throw error;
    return NextResponse.json({ success:true, data });
  } catch(err) {
    return NextResponse.json({ success:false, error:"পণ্য যোগ ব্যর্থ: "+(err.message||"") },{status:500});
  }
}
