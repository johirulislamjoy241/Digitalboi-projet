import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

function userId(req: NextRequest) { return req.headers.get('x-user-id') || '' }

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const uid = userId(req)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // 'remaining' is a GENERATED ALWAYS column in PostgreSQL — never write it
  delete body.remaining

  // Recalculate status if amounts are being updated
  if (body.paid_amount !== undefined || body.total_amount !== undefined) {
    const supabase = createServiceRoleClient()
    const { data: current } = await supabase
      .from('due_ledger')
      .select('total_amount, paid_amount')
      .eq('id', params.id)
      .eq('user_id', uid)
      .single()

    if (current) {
      const total = Number(body.total_amount ?? current.total_amount)
      const paid = Number(body.paid_amount ?? current.paid_amount)
      body.status = paid >= total ? 'Paid' : paid > 0 ? 'Partial' : 'Pending'
    }
  }

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('due_ledger')
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
    .from('due_ledger')
    .delete()
    .eq('id', params.id)
    .eq('user_id', uid)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
