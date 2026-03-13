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

    // Core columns — সব database-এ আছে
    const coreUpdate = {};
    if (body.shop_name !== undefined)    coreUpdate.shop_name = body.shop_name;
    if (body.address !== undefined)      coreUpdate.address = body.address;
    if (body.district !== undefined)     coreUpdate.district = body.district;
    if (body.phone !== undefined)        coreUpdate.phone = body.phone;
    if (body.shop_logo !== undefined)    coreUpdate.shop_logo = body.shop_logo;
    if (body.shop_photos !== undefined)  coreUpdate.shop_photos = body.shop_photos;
    if (body.fb_page_url !== undefined)  coreUpdate.fb_page_url = body.fb_page_url;
    if (body.website_url !== undefined)  coreUpdate.website_url = body.website_url;
    if (body.trade_license !== undefined) coreUpdate.trade_license = body.trade_license;
    if (body.currency !== undefined)     coreUpdate.currency = body.currency;

    // Optional columns (migration v10 এ আছে)
    const optionalUpdate = {};
    if (body.email !== undefined)    optionalUpdate.email = body.email;
    if (body.division !== undefined) optionalUpdate.division = body.division;
    if (body.upazila !== undefined)  optionalUpdate.upazila = body.upazila;
    if (body.thana !== undefined)    optionalUpdate.thana = body.thana;
    if (body.post_code !== undefined) optionalUpdate.post_code = body.post_code;

    const update = { ...coreUpdate, ...optionalUpdate };

    if (Object.keys(update).length === 0)
      return NextResponse.json({ error: 'কোনো আপডেট ডেটা দেওয়া হয়নি' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('shops').update(update).eq('id', user.shopId).select().single();

    if (error) {
      // Optional column error → core only দিয়ে retry
      if (Object.keys(optionalUpdate).length > 0 &&
          (error.message?.includes('column') || error.code === '42703')) {
        const { data: d2, error: e2 } = await supabaseAdmin
          .from('shops').update(coreUpdate).eq('id', user.shopId).select().single();
        if (e2) throw e2;
        return NextResponse.json(d2);
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error('Shop PATCH error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
