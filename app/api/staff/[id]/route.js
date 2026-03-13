import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(req, { params }) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['owner','manager'].includes(user.role)) return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 403 });
  try {
    const body = await req.json();
    const update = {};
    if (body.role)        update.role = body.role;
    if (body.permissions) update.permissions = body.permissions;
    if (body.isActive !== undefined) update.is_active = body.isActive;
    const { data, error } = await supabaseAdmin.from('staff').update(update).eq('id', params.id).eq('shop_id', user.shopId).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch(e) { return NextResponse.json({error:e.message},{status:500}); }
}

export async function DELETE(req, { params }) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'owner') return NextResponse.json({ error: 'শুধু মালিক স্টাফ সরাতে পারবেন' }, { status: 403 });
  await supabaseAdmin.from('staff').update({ is_active: false }).eq('id', params.id).eq('shop_id', user.shopId);
  return NextResponse.json({ success: true });
}
