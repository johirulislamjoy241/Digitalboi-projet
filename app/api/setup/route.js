import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const { data: existing } = await supabaseAdmin.from('users')
      .select('id').eq('role','owner').eq('phone','+8801700000000').maybeSingle();
    if (existing) return NextResponse.json({ message: 'Super admin already exists', id: existing.id });

    const hash = await bcrypt.hash('Digiboi@2025', 10);
    const { data: user, error: uErr } = await supabaseAdmin.from('users').insert({
      phone: '+8801700000000', name: 'Super Admin',
      password_hash: hash, role: 'owner', is_verified: true,
    }).select().single();
    if (uErr) throw uErr;
    return NextResponse.json({ success: true, message: 'Super admin created!', phone: '+8801700000000', password: 'Digiboi@2025' });
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
