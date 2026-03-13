import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.shopId) return NextResponse.json([]);
  const { data } = await supabaseAdmin.from('notifications')
    .select('*').eq('shop_id',user.shopId)
    .order('created_at',{ascending:false}).limit(50);
  return NextResponse.json(data||[]);
}

export async function PATCH(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, all } = await req.json();
  if (all) {
    await supabaseAdmin.from('notifications').update({is_read:true}).eq('shop_id',user.shopId);
  } else if (id) {
    await supabaseAdmin.from('notifications').update({is_read:true}).eq('id',id);
  }
  return NextResponse.json({ success: true });
}

export async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { title, message, type, userId, toAll } = await req.json();
    if (!user.shopId) return NextResponse.json({ error: 'Shop not found' }, { status: 400 });
    if (toAll) {
      // Send to all staff
      const { data: staffList } = await supabaseAdmin.from('staff').select('user_id').eq('shop_id',user.shopId);
      const notifs = (staffList||[]).map(s=>({
        shop_id: user.shopId, user_id: s.user_id, type: type||'info', title, message
      }));
      notifs.push({ shop_id: user.shopId, user_id: user.userId, type: type||'info', title, message });
      await supabaseAdmin.from('notifications').insert(notifs);
    } else {
      await supabaseAdmin.from('notifications').insert({
        shop_id: user.shopId, user_id: userId||user.userId, type: type||'info', title, message
      });
    }
    return NextResponse.json({ success: true });
  } catch(e) { return NextResponse.json({error:e.message},{status:500}); }
}
