import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { productId, type, quantity, reason } = await req.json();

    // ✅ FIXED: stock_quantity → stock
    const { data: product } = await supabaseAdmin.from('products')
      .select('stock, name').eq('id', productId).eq('shop_id', user.shopId).single();
    if (!product) return NextResponse.json({ error: 'পণ্য পাওয়া যায়নি' }, { status: 404 });

    let newStock = Number(product.stock);
    if (type === 'add')    newStock += Number(quantity);
    else if (type === 'remove') newStock = Math.max(0, newStock - Number(quantity));
    else if (type === 'set')    newStock = Number(quantity);

    // ✅ FIXED: stock_quantity → stock
    const { data, error } = await supabaseAdmin.from('products')
      .update({ stock: newStock }).eq('id', productId).select().single();
    if (error) throw error;
    return NextResponse.json({ ...data, before: product.stock, after: newStock });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
