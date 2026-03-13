import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.shopId) return NextResponse.json([]);
  const { searchParams } = new URL(req.url);
  const search   = searchParams.get('search')||'';
  const category = searchParams.get('category')||'';
  const barcode  = searchParams.get('barcode')||'';
  const lowStock = searchParams.get('lowStock')==='true';
  try {
    let q = supabaseAdmin.from('products')
      .select('*, categories(name,color,icon)')
      .eq('shop_id',user.shopId).eq('is_active',true).order('name');
    if (search)   q=q.ilike('name',`%${search}%`);
    if (category) q=q.eq('category_id',category);
    if (barcode)  q=q.eq('barcode',barcode);
    const { data, error } = await q;
    if (error) throw error;
    const result = lowStock ? data.filter(p=>p.stock_quantity<=p.min_stock_alert) : data;
    return NextResponse.json(result);
  } catch(e) { return NextResponse.json({error:e.message},{status:500}); }
}

export async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { name, description, categoryId, barcode, sku, unit,
      costPrice, sellingPrice, stockQuantity, minStockAlert, photos } = await req.json();
    if (!name) return NextResponse.json({ error: 'পণ্যের নাম দিন' }, { status: 400 });
    if (!sellingPrice) return NextResponse.json({ error: 'বিক্রয় মূল্য দিন' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('products').insert({
      shop_id: user.shopId, category_id: categoryId||null,
      name, description: description||null,
      barcode: barcode||null, sku: sku||null,
      unit: unit||'পিস',
      cost_price: Number(costPrice)||0,
      selling_price: Number(sellingPrice),
      stock_quantity: Number(stockQuantity)||0,
      min_stock_alert: Number(minStockAlert)||5,
      photos: photos||[],
    }).select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch(e) { return NextResponse.json({error:e.message},{status:500}); }
}
