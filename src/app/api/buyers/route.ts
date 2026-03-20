import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

function userId(req: NextRequest) { return req.headers.get('x-user-id') || '' }

export async function GET(req: NextRequest) {
  const uid = userId(req)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase.from('buyers').select('*').eq('user_id', uid).order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const uid = userId(req)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.name) return NextResponse.json({ error: 'Buyer name required' }, { status: 400 })
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase.from('buyers').insert({ ...body, user_id: uid }).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
