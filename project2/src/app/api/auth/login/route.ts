import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

// Fix #21: same hash function as register
function hashPassword(password: string): string {
  return createHash('sha256').update(password + process.env.PASSWORD_SALT || 'digiboi_salt_2024').digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json()
    if (!phone || !password) {
      return NextResponse.json({ error: 'Phone and password required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const fullPhone = phone.replace(/\s+/g, '')

    const { data, error } = await supabase
      .from('users')
      .select('id, phone, password, shop_name, owner_name, created_at')
      .eq('phone', fullPhone)
      .maybeSingle()

    if (error) {
      console.error('Login DB error:', error)
      return NextResponse.json({ error: 'Server error. Try again.' }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'No account found for this phone number.' }, { status: 401 })
    }

    // Fix #21: compare hashed — support both old plain-text and new hashed passwords
    const hashed = hashPassword(password)
    const passwordMatch = data.password === hashed || data.password === password
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
    }

    // If old plain-text password matched, silently upgrade to hashed
    if (data.password === password) {
      await supabase.from('users').update({ password: hashed }).eq('id', data.id)
    }

    const user = {
      id: data.id, phone: data.phone, shop_name: data.shop_name,
      owner_name: data.owner_name, created_at: data.created_at
    }
    return NextResponse.json({ user })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Server error. Try again.' }, { status: 500 })
  }
}
