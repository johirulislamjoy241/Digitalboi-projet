import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'digiboi-secret';

// বাংলাদেশী ফোন যাচাই — সব ফরম্যাট সাপোর্ট করে
function isBDPhone(phone) {
  const clean = phone.replace(/[\s\-()]/g, '');
  // 01XXXXXXXXX, 8801XXXXXXXXX, +8801XXXXXXXXX, 1XXXXXXXXX
  return /^(\+?880|0)?1[3-9]\d{8}$/.test(clean);
}

// সব ফরম্যাট → +8801XXXXXXXXX
function normalizePhone(phone) {
  const clean = phone.replace(/[\s\-()]/g, '');
  if (clean.startsWith('+880')) return clean;
  if (clean.startsWith('880'))  return '+' + clean;
  if (clean.startsWith('0'))    return '+88' + clean;
  if (/^1[3-9]\d{8}$/.test(clean)) return '+880' + clean;
  return '+880' + clean;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      phone, email, password, fullName, nidNumber,
      nidFrontPhoto, nidBackPhoto, profilePhoto,
      shopName, businessType, address,
      district, division, upazila, thana, postCode,
      latitude, longitude,
      shopPhone, tradeLicense, tradeLicensePhoto,
      shopPhotos, fbPageUrl, websiteUrl,
    } = body;

    // ── 1. Validation ──
    if (!phone?.trim())
      return NextResponse.json({ error: 'ফোন নম্বর দিন' }, { status: 400 });

    if (!isBDPhone(phone))
      return NextResponse.json({ error: 'শুধুমাত্র বাংলাদেশী ফোন নম্বর গ্রহণযোগ্য (01XXXXXXXXX)' }, { status: 400 });

    if (!password || password.length < 8)
      return NextResponse.json({ error: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে' }, { status: 400 });

    if (!fullName?.trim())
      return NextResponse.json({ error: 'আপনার পূর্ণ নাম দিন' }, { status: 400 });

    if (!shopName?.trim())
      return NextResponse.json({ error: 'দোকানের নাম দিন' }, { status: 400 });

    if (!address?.trim())
      return NextResponse.json({ error: 'দোকানের ঠিকানা দিন' }, { status: 400 });

    const normalizedPhone = normalizePhone(phone);

    // ── 2. Duplicate check ──
    const { data: exPhone } = await supabaseAdmin
      .from('users').select('id').eq('phone', normalizedPhone).maybeSingle();
    if (exPhone)
      return NextResponse.json({ error: 'এই ফোন নম্বরে আগেই অ্যাকাউন্ট আছে। লগইন করুন।' }, { status: 400 });

    if (email?.trim()) {
      const { data: exEmail } = await supabaseAdmin
        .from('users').select('id').eq('email', email.toLowerCase()).maybeSingle();
      if (exEmail)
        return NextResponse.json({ error: 'এই ইমেইলে আগেই অ্যাকাউন্ট আছে' }, { status: 400 });
    }

    // ── 3. User তৈরি ──
    const passwordHash = await bcrypt.hash(password, 10);
    const { data: user, error: uErr } = await supabaseAdmin.from('users').insert({
      phone: normalizedPhone,
      email: email?.toLowerCase() || null,
      password_hash: passwordHash,
      full_name: fullName.trim(),
      role: 'owner',
      profile_photo: profilePhoto || null,
      nid_number: nidNumber || null,
      nid_front_photo: nidFrontPhoto || null,
      nid_back_photo: nidBackPhoto || null,
    }).select().single();

    if (uErr) {
      console.error('User create error:', uErr);
      return NextResponse.json({ error: 'ব্যবহারকারী তৈরিতে সমস্যা: ' + uErr.message }, { status: 500 });
    }

    // ── 4. Shop data তৈরি ──
    const verificationCode = businessType !== 'physical'
      ? `DIGIBOI-VRF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
      : null;

    // সব location parts একসাথে address তৈরি
    const addressParts = [address?.trim(), upazila, thana, district, division].filter(Boolean);
    if (postCode) addressParts.push(postCode);
    const fullAddress = addressParts.join(', ');

    // shops table schema অনুযায়ী শুধু valid columns
    const shopInsert = {
      owner_id: user.id,
      shop_name: shopName.trim(),
      business_type: businessType || 'physical',
      address: fullAddress,
      district: district || null,
      phone: shopPhone ? normalizePhone(shopPhone) : normalizedPhone,
      trade_license: tradeLicense || null,
      trade_license_photo: tradeLicensePhoto || null,
      shop_photos: Array.isArray(shopPhotos) ? shopPhotos : [],
      fb_page_url: fbPageUrl || null,
      website_url: websiteUrl || null,
      verification_code: verificationCode,
    };

    // Optional columns — migration চালালে থাকবে
    // email column যোগ করা (migration v10 এ আছে)
    if (email?.trim()) shopInsert.email = email.toLowerCase();
    // division, upazila etc. — migration v10 এ আছে
    if (division) shopInsert.division = division;
    if (upazila) shopInsert.upazila = upazila;
    if (thana) shopInsert.thana = thana;
    if (postCode) shopInsert.post_code = postCode;
    if (latitude) shopInsert.latitude = latitude;
    if (longitude) shopInsert.longitude = longitude;

    // প্রথমে সব columns দিয়ে চেষ্টা
    let shop = null;
    const { data: shopFull, error: sErr1 } = await supabaseAdmin
      .from('shops').insert(shopInsert).select().single();

    if (!sErr1) {
      shop = shopFull;
    } else {
      // column not found error → stripped version দিয়ে retry
      console.error('Shop full insert error:', sErr1.message);
      const stripped = {
        owner_id: shopInsert.owner_id,
        shop_name: shopInsert.shop_name,
        business_type: shopInsert.business_type,
        address: shopInsert.address,
        district: shopInsert.district,
        phone: shopInsert.phone,
        trade_license: shopInsert.trade_license,
        shop_photos: shopInsert.shop_photos,
        fb_page_url: shopInsert.fb_page_url,
        website_url: shopInsert.website_url,
        verification_code: shopInsert.verification_code,
      };
      const { data: shopStripped, error: sErr2 } = await supabaseAdmin
        .from('shops').insert(stripped).select().single();

      if (sErr2) {
        // Rollback: user মুছে দাও
        await supabaseAdmin.from('users').delete().eq('id', user.id);
        console.error('Shop stripped insert error:', sErr2.message);
        return NextResponse.json({ error: 'দোকান তৈরিতে সমস্যা: ' + sErr2.message }, { status: 500 });
      }
      shop = shopStripped;
    }

    // ── 5. JWT Token ──
    const token = jwt.sign(
      { userId: user.id, role: user.role, shopId: shop.id },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const { password_hash, ...safeUser } = user;
    return NextResponse.json({ user: safeUser, shop, token }, { status: 201 });

  } catch (e) {
    console.error('Register error:', e);
    return NextResponse.json({ error: 'রেজিস্ট্রেশনে সমস্যা: ' + e.message }, { status: 500 });
  }
}
