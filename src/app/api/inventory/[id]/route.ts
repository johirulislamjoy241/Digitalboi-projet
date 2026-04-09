import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

function userId(req: NextRequest) { return req.headers.get('x-user-id') || '' }

function calcStatus(qty: number, threshold: number): string {
  if (qty <= 0) return 'Out of Stock'
  if (qty <= threshold) return 'Low Stock'
  return 'In Stock'
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const uid = userId(req)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Recalculate status if quantity is being updated
  if (body.quantity !== undefined) {
    const threshold = Number(body.low_stock_threshold) || 10
    body.status = calcStatus(Number(body.quantity), threshold)
  }

  // Never allow client to set status directly when quantity is present
  delete body.low_stock_threshold

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('inventory')
    .update(body)
    .eq('id', params.id)
    .eq('user_id', uid)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const uid = userId(req)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceRoleClient()
  const { error } = await supabase
    .from('inventory')
    .delete()
    .eq('id', params.id)
    .eq('user_id', uid)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
