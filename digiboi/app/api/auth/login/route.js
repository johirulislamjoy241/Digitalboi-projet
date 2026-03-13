import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'digiboi-secret';

// ফোন নরমালাইজ — register এর মতোই
function normalizePhone(phone) {
  const clean = phone.replace(/[\s\-()]/g, '');
  if (clean.startsWith('+880')) return clean;
  if (clean.startsWith('880')) return '+' + clean;
  if (clean.startsWith('0')) return '+88' + clean;
  // 1XXXXXXXXX format (no leading 0)
  if (/^1[3-9]\d{8}$/.test(clean)) return '+880' + clean;
  return clean; // fallback
}

export async function POST(req) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password)
      return NextResponse.json({ error: 'ফোন/ইমেইল ও পাসওয়ার্ড দিন' }, { status: 400 });

    // ফোন না ইমেইল নির্ণয়
    const isEmail = identifier.includes('@');
    let user = null;

    if (isEmail) {
      const { data } = await supabaseAdmin
        .from('users').select('*')
        .eq('email', identifier.toLowerCase().trim())
        .eq('is_active', true).eq('is_blocked', false)
        .maybeSingle();
      user = data;
    } else {
      // ফোন — normalized ও raw দুটো দিয়েই চেক করো
      const normalizedPhone = normalizePhone(identifier);
      const rawPhone = identifier.replace(/[\s\-()]/g, '');

      // প্রথমে normalized দিয়ে
      const { data: u1 } = await supabaseAdmin
        .from('users').select('*')
        .eq('phone', normalizedPhone)
        .eq('is_active', true).eq('is_blocked', false)
        .maybeSingle();

      if (u1) {
        user = u1;
      } else if (normalizedPhone !== rawPhone) {
        // raw দিয়ে চেষ্টা
        const { data: u2 } = await supabaseAdmin
          .from('users').select('*')
          .eq('phone', rawPhone)
          .eq('is_active', true).eq('is_blocked', false)
          .maybeSingle();
        user = u2;
      }
    }

    if (!user) return NextResponse.json({ error: 'অ্যাকাউন্ট পাওয়া যায়নি। ফোন নম্বর বা পাসওয়ার্ড যাচাই করুন।' }, { status: 401 });

    // পাসওয়ার্ড যাচাই
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return NextResponse.json({ error: 'পাসওয়ার্ড ভুল হয়েছে' }, { status: 401 });

    // দোকান খোঁজো — owner হলে সরাসরি
    let shop = null;
    let shopId = null;

    if (user.role === 'owner' || user.role === 'super_admin') {
      const { data: ownerShop } = await supabaseAdmin
        .from('shops').select('*')
        .eq('owner_id', user.id).eq('is_active', true)
        .maybeSingle();
      shop = ownerShop;
      shopId = ownerShop?.id || null;
    } else {
      // Staff হলে staff table থেকে shop খোঁজো
      const { data: staffRecord } = await supabaseAdmin
        .from('staff')
        .select('shop_id, role, permissions, shops(*)')
        .eq('user_id', user.id).eq('is_active', true)
        .maybeSingle();

      if (staffRecord) {
        shopId = staffRecord.shop_id;
        shop = staffRecord.shops;
        // Staff role ব্যবহার করো (shop-specific)
        user = { ...user, role: staffRecord.role, permissions: staffRecord.permissions };
      }
    }

    // JWT Token
    const token = jwt.sign(
      { userId: user.id, role: user.role, shopId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Last login আপডেট
    await supabaseAdmin.from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    const { password_hash, ...safeUser } = user;
    return NextResponse.json({ user: safeUser, shop, token });

  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json({ error: 'সার্ভারে সমস্যা: ' + e.message }, { status: 500 });
  }
}
