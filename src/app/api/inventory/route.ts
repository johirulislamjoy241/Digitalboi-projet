import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

function userId(req: NextRequest) { return req.headers.get('x-user-id') || '' }

export async function GET(req: NextRequest) {
  const uid = userId(req)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('inventory').select('*').eq('user_id', uid).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const uid = userId(req)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { name, category, quantity, unit, buy_price, sell_price, notes, image_url, product_link } = body
  if (!name) return NextResponse.json({ error: 'Product name required' }, { status: 400 })
  const qty = Number(quantity) || 0
  const threshold = 10
  const status = qty <= 0 ? 'Out of Stock' : qty <= threshold ? 'Low Stock' : 'In Stock'
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('inventory')
    .insert({ user_id: uid, name, category: category || 'General', quantity: qty, unit: unit || 'pcs', buy_price: Number(buy_price) || 0, sell_price: Number(sell_price) || 0, status, notes, image_url, product_link })
    .select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
