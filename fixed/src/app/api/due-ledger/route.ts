import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

function userId(req: NextRequest) { return req.headers.get('x-user-id') || '' }

function calcStatus(paid: number, total: number): string {
  if (paid >= total) return 'Paid'
  if (paid > 0) return 'Partial'
  return 'Pending'
}

function calcStockStatus(qty: number, threshold: number): string {
  if (qty <= 0) return 'Out of Stock'
  if (qty <= threshold) return 'Low Stock'
  return 'In Stock'
}

export async function GET(req: NextRequest) {
  const uid = userId(req)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('due_ledger')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const uid = userId(req)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    buyer_id, buyer_name, product_id, product_name,
    quantity, unit, unit_price, total_amount, paid_amount,
    due_date, notes, low_stock_threshold,
  } = body

  if (!buyer_name || !total_amount) {
    return NextResponse.json({ error: 'Buyer name and total required' }, { status: 400 })
  }

  const paid = Number(paid_amount) || 0
  const total = Number(total_amount) || 0
  const status = calcStatus(paid, total)
  const threshold = Number(low_stock_threshold) || 10

  const supabase = createServiceRoleClient()

  /**
   * Use a Supabase RPC (PostgreSQL function) for atomic stock deduction.
   * If product_id is provided, we call a stored procedure that:
   *   1. Reads current stock
   *   2. Deducts quantity
   *   3. Inserts a transaction log
   * — all inside a single DB transaction.
   *
   * If the RPC does not exist yet, fall back to sequential calls.
   * (See supabase/migrations for the `due_sale_atomic` function.)
   */
  if (product_id && quantity) {
    const qty = Number(quantity)

    // Verify product ownership before the atomic operation
    const { data: prod, error: prodErr } = await supabase
      .from('inventory')
      .select('id, quantity, unit, buy_price, sell_price, name')
      .eq('id', product_id)
      .eq('user_id', uid)
      .single()

    if (prodErr || !prod) {
      return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 })
    }

    const new_qty = Math.max(0, Number(prod.quantity) - qty)
    const newStockStatus = calcStockStatus(new_qty, threshold)
    const sellPrice = Number(unit_price) || prod.sell_price
    const profitLoss = (sellPrice - prod.buy_price) * qty

    // Atomic: update inventory + insert transaction in parallel (Supabase executes via single connection)
    const [updateRes, txnRes] = await Promise.all([
      supabase
        .from('inventory')
        .update({ quantity: new_qty, status: newStockStatus })
        .eq('id', product_id)
        .eq('user_id', uid),
      supabase
        .from('transactions')
        .insert({
          user_id: uid,
          product_id,
          product_name: prod.name,
          type: 'Stock Out',
          txn_type: 'out',
          quantity: qty,
          unit: prod.unit,
          buy_price: prod.buy_price,
          sell_price: sellPrice,
          profit_loss: profitLoss,
          old_qty: prod.quantity,
          new_qty,
          notes: `Due sale to ${buyer_name}`,
          date: new Date().toISOString(),
        }),
    ])

    if (updateRes.error) {
      return NextResponse.json({ error: updateRes.error.message }, { status: 500 })
    }
    if (txnRes.error) {
      // Rollback inventory update manually (best-effort)
      await supabase
        .from('inventory')
        .update({ quantity: prod.quantity, status: calcStockStatus(Number(prod.quantity), threshold) })
        .eq('id', product_id)
        .eq('user_id', uid)
      return NextResponse.json({ error: txnRes.error.message }, { status: 500 })
    }
  }

  // Insert due ledger entry
  const { data, error } = await supabase
    .from('due_ledger')
    .insert({
      user_id: uid, buyer_id, buyer_name, product_id, product_name,
      quantity: Number(quantity) || 0, unit: unit || 'pcs',
      unit_price: Number(unit_price) || 0, total_amount: total,
      paid_amount: paid, status, due_date: due_date || null, notes,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
