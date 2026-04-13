import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { signToken } from '@/lib/jwt'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase.from('users').select('id, phone, shop_name, owner_name, created_at').eq('id', userId).single()
    if (error || !data) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const token = await signToken({ sub: data.id, phone: data.phone, shop_name: data.shop_name, owner_name: data.owner_name })
    return NextResponse.json({ token, user: data })
  } catch (err) {
    console.error('Token error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
