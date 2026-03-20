import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      loginPhone, password, shopName, ownerName,
      shopType, country, stateDiv, city, address,
      shopPhone, shopEmail, ownerPhone, ownerEmail,
      nid, dob, gender
    } = body

    if (!loginPhone || !password || !shopName || !ownerName) {
      return NextResponse.json({ error: 'Required fields missing.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const fullPhone = loginPhone.replace(/\s+/g, '')

    // Check duplicate phone — use maybeSingle() to avoid error when not found
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone', fullPhone)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json({ error: '⛔ This phone number is already registered. Please sign in.' }, { status: 409 })
    }

    // Check duplicate NID — use maybeSingle()
    if (nid) {
      const { data: existingNid } = await supabase
        .from('registrations')
        .select('id')
        .eq('nid', nid)
        .maybeSingle()

      if (existingNid) {
        return NextResponse.json({ error: '⛔ This National ID is already registered.' }, { status: 409 })
      }
    }

    // Create user
    const { data: newUser, error: userErr } = await supabase
      .from('users')
      .insert({
        phone: fullPhone,
        password,
        shop_name: shopName,
        owner_name: ownerName
      })
      .select('id')
      .single()

    if (userErr || !newUser) {
      console.error('User insert error:', userErr)
      return NextResponse.json({ error: userErr?.message || 'Registration failed. Try again.' }, { status: 500 })
    }

    // Create registration profile (non-blocking — don't fail if this errors)
    await supabase.from('registrations').insert({
      user_id: newUser.id,
      shop_name: shopName,
      shop_type: shopType,
      country,
      state_div: stateDiv,
      city,
      address,
      shop_phone: shopPhone,
      shop_email: shopEmail,
      owner_name: ownerName,
      owner_phone: ownerPhone,
      owner_email: ownerEmail,
      nid: nid || null,
      dob: dob || null,
      gender: gender || null,
      login_phone: fullPhone
    })

    return NextResponse.json({ success: true, userId: newUser.id })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Server error. Try again.' }, { status: 500 })
  }
}
