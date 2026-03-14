export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = req.nextUrl;
    const shopId     = searchParams.get("shopId");
    const search     = searchParams.get("search") || "";
    const customerId = searchParams.get("customerId");
    if (!shopId) return NextResponse.json({success:false,error:"shopId প্রয়োজন"},{status:400});
    if (customerId) {
      const { data, error } = await supabaseAdmin.from("customers").select("*").eq("id",customerId).single();
      if (error) throw error;
      return NextResponse.json({ success:true, data });
    }
    let q = supabaseAdmin.from("customers").select("*").eq("shop_id",shopId).order("name");
    if (search) q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json({ success:true, data:data||[] });
  } catch(err) {
    return NextResponse.json({ success:false, error:"লোড ব্যর্থ: "+err.message },{status:500});
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { shopId, name, phone, alt_phone, email, nid, dob, gender, address, reference, notes, customer_type } = body;
    if (!shopId||!name) return NextResponse.json({success:false,error:"shopId ও নাম দিন"},{status:400});

    const insertData = {
      shop_id:shopId, name,
      phone:phone||null, address:address||null,
      customer_type:customer_type||"Regular",
    };
    // Extra fields — add only if column exists (graceful)
    try { insertData.alt_phone  = alt_phone||null;  } catch {}
    try { insertData.email      = email||null;      } catch {}
    try { insertData.nid        = nid||null;        } catch {}
    try { insertData.dob        = dob||null;        } catch {}
    try { insertData.gender     = gender||"পুরুষ";  } catch {}
    try { insertData.reference  = reference||null;  } catch {}
    try { insertData.notes      = notes||null;      } catch {}

    const { data, error } = await supabaseAdmin.from("customers").insert(insertData).select().single();
    if (error) {
      // Retry with base fields only if extra fields cause error
      if (error.message?.includes("column")) {
        const { data:d2, error:e2 } = await supabaseAdmin.from("customers")
          .insert({ shop_id:shopId, name, phone:phone||null, address:address||null, customer_type:customer_type||"Regular" })
          .select().single();
        if (e2) throw e2;
        return NextResponse.json({ success:true, data:d2 });
      }
      throw error;
    }
    return NextResponse.json({ success:true, data });
  } catch(err) {
    return NextResponse.json({ success:false, error:"যোগ ব্যর্থ: "+(err.message||"") },{status:500});
  }
}
