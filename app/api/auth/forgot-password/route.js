export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

function normalizePhone(phone) {
  const clean = phone.replace(/[\s\-()]/g, '');
  if (clean.startsWith('+880')) return clean;
  if (clean.startsWith('880'))  return '+' + clean;
  if (clean.startsWith('0'))    return '+88' + clean;
  if (/^1[3-9]\d{8}$/.test(clean)) return '+880' + clean;
  return clean;
}

// POST: OTP পাঠাও
export async function POST(req) {
  try {
    const { phone } = await req.json();
    if (!phone?.trim())
      return NextResponse.json({ error: 'ফোন নম্বর দিন' }, { status: 400 });

    const normalizedPhone = normalizePhone(phone);

    // ── Account আছে কিনা যাচাই ──
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, phone, is_active, is_blocked')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (!user)
      return NextResponse.json({ error: 'এই নম্বরে কোনো অ্যাকাউন্ট নেই' }, { status: 404 });

    if (!user.is_active)
      return NextResponse.json({ error: 'এই অ্যাকাউন্টটি নিষ্ক্রিয়' }, { status: 403 });

    if (user.is_blocked)
      return NextResponse.json({ error: 'এই অ্যাকাউন্ট ব্লক করা হয়েছে' }, { status: 403 });

    // ── OTP তৈরি ──
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 মিনিট

    // ── upsert: phone UNIQUE constraint আছে ──
    const { error: otpErr } = await supabaseAdmin
      .from('otp_requests')
      .upsert(
        { phone: normalizedPhone, otp, expires_at: expiresAt },
        { onConflict: 'phone' }
      );

    if (otpErr) throw otpErr;

    // Production: SMS API দিয়ে পাঠাও
    // Development: response-এ দেখাও
    console.log(`OTP for ${normalizedPhone}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: 'OTP পাঠানো হয়েছে',
      otp, // TODO: production-এ এটি সরিয়ে ফেলুন
    });

  } catch (e) {
    console.error('OTP send error:', e);
    return NextResponse.json({ error: 'OTP পাঠাতে সমস্যা: ' + e.message }, { status: 500 });
  }
}

// PATCH: OTP যাচাই + পাসওয়ার্ড পরিবর্তন
export async function PATCH(req) {
  try {
    const { phone, otp, newPassword } = await req.json();

    if (!phone?.trim() || !otp?.trim() || !newPassword)
      return NextResponse.json({ error: 'সব তথ্য দিন' }, { status: 400 });

    if (newPassword.length < 8)
      return NextResponse.json({ error: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে' }, { status: 400 });

    const normalizedPhone = normalizePhone(phone);

    // ── Account আছে কিনা আবার যাচাই ──
    const { data: user } = await supabaseAdmin
      .from('users').select('id').eq('phone', normalizedPhone).maybeSingle();

    if (!user)
      return NextResponse.json({ error: 'অ্যাকাউন্ট পাওয়া যায়নি' }, { status: 404 });

    // ── OTP যাচাই ──
    const { data: record } = await supabaseAdmin
      .from('otp_requests')
      .select('otp, expires_at')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (!record)
      return NextResponse.json({ error: 'OTP পাওয়া যায়নি। আবার চেষ্টা করুন।' }, { status: 400 });

    if (record.otp !== otp.trim())
      return NextResponse.json({ error: 'OTP ভুল হয়েছে' }, { status: 400 });

    if (new Date(record.expires_at) < new Date())
      return NextResponse.json({ error: 'OTP-এর মেয়াদ শেষ হয়ে গেছে। আবার পাঠান।' }, { status: 400 });

    // ── পাসওয়ার্ড আপডেট ──
    const hash = await bcrypt.hash(newPassword, 10);
    const { error: updateErr } = await supabaseAdmin
      .from('users').update({ password_hash: hash }).eq('id', user.id);

    if (updateErr) throw updateErr;

    // OTP মুছে ফেলো
    await supabaseAdmin.from('otp_requests').delete().eq('phone', normalizedPhone);

    return NextResponse.json({ success: true, message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে' });

  } catch (e) {
    console.error('Password reset error:', e);
    return NextResponse.json({ error: 'পাসওয়ার্ড পরিবর্তনে সমস্যা: ' + e.message }, { status: 500 });
  }
}
