import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

function userId(req: NextRequest) { return req.headers.get('x-user-id') || '' }

export async function GET(req: NextRequest) {
  const uid = userId(req)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const limit = parseInt(url.searchParams.get('limit') || '100')
  const offset = parseInt(url.searchParams.get('offset') || '0')
  const supabase = createServiceRoleClient()
  const { data, error, count } = await supabase
    .from('transactions').select('*', { count: 'exact' })
    .eq('user_id', uid).order('date', { ascending: false }).range(offset, offset + limit - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, count })
}

export async function POST(req: NextRequest) {
  const uid = userId(req)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { product_id, product_name, txn_type, quantity, unit, buy_price, sell_price, notes, new_buy_price, new_sell_price } = body

  if (!product_id || !product_name || !txn_type || !quantity)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const supabase = createServiceRoleClient()
  const qty = Number(quantity)

  // Get current product
  const { data: product, error: pErr } = await supabase
    .from('inventory').select('*').eq('id', product_id).eq('user_id', uid).single()
  if (pErr || !product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const old_qty = Number(product.quantity)
  let new_qty = old_qty
  let type = ''
  let profit_loss = 0
  const bp = Number(buy_price) || Number(product.buy_price) || 0
  const sp = Number(sell_price) || Number(product.sell_price) || 0

  if (txn_type === 'in') {
    new_qty = old_qty + qty
    type = 'Stock In'
  } else if (txn_type === 'out') {
    if (qty > old_qty) return NextResponse.json({ error: `Not enough stock. Available: ${old_qty}` }, { status: 400 })
    new_qty = old_qty - qty
    profit_loss = (sp - bp) * qty
    type = profit_loss < 0 ? 'Loss' : 'Stock Out'
  } else if (txn_type === 'price') {
    type = 'Price Update'
  }

  const threshold = 10
  const newStatus = new_qty <= 0 ? 'Out of Stock' : new_qty <= threshold ? 'Low Stock' : 'In Stock'

  // Update inventory
  const updateFields: Record<string, unknown> = { quantity: new_qty, status: newStatus }
  if (txn_type === 'price' || (txn_type === 'in' && new_buy_price)) {
    if (new_buy_price) updateFields.buy_price = Number(new_buy_price)
    if (new_sell_price) updateFields.sell_price = Number(new_sell_price)
  }

  const { error: updateErr } = await supabase.from('inventory').update(updateFields).eq('id', product_id)
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Insert transaction log
  const { data: txn, error: txnErr } = await supabase.from('transactions').insert({
    user_id: uid, product_id, product_name, type, txn_type, quantity: qty, unit: unit || product.unit || 'pcs',
    buy_price: bp, sell_price: sp, profit_loss, old_qty, new_qty, notes, date: new Date().toISOString()
  }).select('*').single()

  if (txnErr) return NextResponse.json({ error: txnErr.message }, { status: 500 })
  return NextResponse.json({ data: txn, new_qty, profit_loss })
}
