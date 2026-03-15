import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.shopId) return NextResponse.json({ error: 'দোকান নেই' }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .from('shops').select('*').eq('id', user.shopId).maybeSingle();

  if (error || !data) return NextResponse.json({ error: 'দোকান পাওয়া যায়নি' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.shopId) return NextResponse.json({ error: 'দোকান নেই' }, { status: 404 });

  try {
    const body = await req.json();
    const update = {};

    // ✅ FIXED: schema-র সঠিক column নাম ব্যবহার করা হয়েছে
    if (body.name         !== undefined) update.name         = body.name;
    if (body.phone        !== undefined) update.phone        = body.phone;
    if (body.email        !== undefined) update.email        = body.email;
    if (body.address      !== undefined) update.address      = body.address;
    if (body.division     !== undefined) update.division     = body.division;
    if (body.district     !== undefined) update.district     = body.district;
    if (body.upazila      !== undefined) update.upazila      = body.upazila;
    if (body.post_code    !== undefined) update.post_code    = body.post_code;
    if (body.logo_url     !== undefined) update.logo_url     = body.logo_url;      // ✅ FIXED: shop_logo → logo_url
    if (body.biz_type     !== undefined) update.biz_type     = body.biz_type;
    if (body.biz_category !== undefined) update.biz_category = body.biz_category;  // migration v11
    if (body.website      !== undefined) update.website      = body.website;       // migration v11
    if (body.social_link  !== undefined) update.social_link  = body.social_link;   // migration v11
    if (body.trade_license !== undefined) update.trade_license = body.trade_license; // migration v11

    if (Object.keys(update).length === 0)
      return NextResponse.json({ error: 'কোনো আপডেট ডেটা দেওয়া হয়নি' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('shops').update(update).eq('id', user.shopId).select().single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    console.error('Shop PATCH error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
