import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

function userId(req: NextRequest) { return req.headers.get('x-user-id') || '' }

export async function GET(req: NextRequest) {
  const uid = userId(req)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('due_ledger').select('*').eq('user_id', uid).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const uid = userId(req)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { buyer_id, buyer_name, product_id, product_name, quantity, unit, unit_price, total_amount, paid_amount, due_date, notes } = body
  if (!buyer_name || !total_amount) return NextResponse.json({ error: 'Buyer name and total required' }, { status: 400 })

  const paid = Number(paid_amount) || 0
  const total = Number(total_amount) || 0
  const status = paid >= total ? 'Paid' : paid > 0 ? 'Partial' : 'Pending'

  const supabase = createServiceRoleClient()

  // If product selected, reduce stock (due sale = stock out)
  if (product_id && quantity) {
    const qty = Number(quantity)
    const { data: prod } = await supabase.from('inventory').select('*').eq('id', product_id).eq('user_id', uid).single()
    if (prod) {
      const new_qty = Math.max(0, Number(prod.quantity) - qty)
      const threshold = 10
      const newStatus = new_qty <= 0 ? 'Out of Stock' : new_qty <= threshold ? 'Low Stock' : 'In Stock'
      await supabase.from('inventory').update({ quantity: new_qty, status: newStatus }).eq('id', product_id)
      // Log transaction
      await supabase.from('transactions').insert({
        user_id: uid, product_id, product_name: prod.name, type: 'Stock Out', txn_type: 'out',
        quantity: qty, unit: prod.unit, buy_price: prod.buy_price, sell_price: unit_price || prod.sell_price,
        profit_loss: ((Number(unit_price) || prod.sell_price) - prod.buy_price) * qty,
        old_qty: prod.quantity, new_qty, notes: `Due sale to ${buyer_name}`, date: new Date().toISOString()
      })
    }
  }

  const { data, error } = await supabase.from('due_ledger').insert({
    user_id: uid, buyer_id, buyer_name, product_id, product_name, quantity: Number(quantity) || 0,
    unit: unit || 'pcs', unit_price: Number(unit_price) || 0, total_amount: total,
    paid_amount: paid, status, due_date: due_date || null, notes
  }).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
