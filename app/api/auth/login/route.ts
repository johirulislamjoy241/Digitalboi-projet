import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

async function makeToken(uid: string, phone: string, sn: string, on: string): Promise<string> {
  const secret = process.env.JWT_SECRET || 'digiboi-dev-secret'
  const exp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
  const payloadB64 = btoa(JSON.stringify({ uid, phone, sn, on, exp }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  return `${payloadB64}.${sigB64}`
}

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json()
    if (!phone || !password) return NextResponse.json({ error: 'Phone and password required' }, { status: 400 })

    const supabase = createServiceRoleClient()
    const fullPhone = phone.replace(/\s+/g, '')

    const { data, error } = await supabase
      .from('users')
      .select('id, phone, password, shop_name, owner_name, created_at')
      .eq('phone', fullPhone)
      .maybeSingle()

    if (error) return NextResponse.json({ error: 'Server error. Try again.' }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'No account found for this phone number.' }, { status: 401 })

    // bcrypt hash অথবা plain text উভয়ই support করে
    const isHashed = data.password.startsWith('$2')
    let match = false

    if (isHashed) {
      match = await bcrypt.compare(password, data.password)
    } else {
      match = data.password === password
      if (match) {
        // auto-migrate plain text to bcrypt
        const hashed = await bcrypt.hash(password, 10)
        await supabase.from('users').update({ password: hashed }).eq('id', data.id)
      }
    }

    if (!match) return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })

    const token = await makeToken(data.id, data.phone, data.shop_name, data.owner_name)
    const user = { id: data.id, phone: data.phone, shop_name: data.shop_name, owner_name: data.owner_name, created_at: data.created_at }

    return NextResponse.json({ user, token })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Server error. Try again.' }, { status: 500 })
  }
}
