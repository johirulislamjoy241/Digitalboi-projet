import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req, { params }) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin.from('products')
    .select('*, categories(name,color,icon)').eq('id', params.id).eq('shop_id', user.shopId).maybeSingle();
  if (error||!data) return NextResponse.json({ error: 'পণ্য পাওয়া যায়নি' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req, { params }) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const { action, quantity, type } = body;

    if (action === 'adjust_stock') {
      const { data: p } = await supabaseAdmin.from('products')
        .select('stock_quantity').eq('id', params.id).single();
      let newStock = p.stock_quantity;
      if (type === 'add') newStock += Number(quantity);
      else if (type === 'remove') newStock = Math.max(0, newStock - Number(quantity));
      else if (type === 'set') newStock = Number(quantity);
      const { data, error } = await supabaseAdmin.from('products')
        .update({ stock_quantity: newStock }).eq('id', params.id).eq('shop_id', user.shopId).select().single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    const allowed = ['name','description','categoryId','barcode','sku','unit','cost_price','selling_price','stock_quantity','min_stock_alert','photos','is_active'];
    const update = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.description !== undefined) update.description = body.description;
    if (body.categoryId !== undefined) update.category_id = body.categoryId;
    if (body.barcode !== undefined) update.barcode = body.barcode;
    if (body.unit !== undefined) update.unit = body.unit;
    if (body.costPrice !== undefined) update.cost_price = Number(body.costPrice);
    if (body.sellingPrice !== undefined) update.selling_price = Number(body.sellingPrice);
    if (body.stockQuantity !== undefined) update.stock_quantity = Number(body.stockQuantity);
    if (body.minStockAlert !== undefined) update.min_stock_alert = Number(body.minStockAlert);
    if (body.photos !== undefined) update.photos = body.photos;
    if (body.isActive !== undefined) update.is_active = body.isActive;

    const { data, error } = await supabaseAdmin.from('products')
      .update(update).eq('id', params.id).eq('shop_id', user.shopId).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch(e) { return NextResponse.json({error:e.message},{status:500}); }
}

export async function DELETE(req, { params }) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { error } = await supabaseAdmin.from('products')
    .update({ is_active: false }).eq('id', params.id).eq('shop_id', user.shopId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
