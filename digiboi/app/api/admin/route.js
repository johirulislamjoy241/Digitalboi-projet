import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

function adminOnly(user) {
  if (!user || user.role !== 'super_admin')
    return NextResponse.json({ error: 'অনুমতি নেই — শুধু Super Admin' }, { status: 403 });
  return null;
}

// ── GET ──────────────────────────────────────────────────
export async function GET(req) {
  const user = getUserFromRequest(req);
  const denied = adminOnly(user);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'shops';

  try {
    if (type === 'shops') {
      const { data, error } = await supabaseAdmin
        .from('shops')
        .select(`
          *,
          users!owner_id(
            id, full_name, phone, email,
            nid_number, nid_verified,
            nid_front_photo, nid_back_photo,
            is_active, is_blocked, last_login, created_at
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json(data || []);
    }

    if (type === 'users') {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id,full_name,phone,email,role,nid_number,nid_verified,is_active,is_blocked,last_login,created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json(data || []);
    }

    if (type === 'stats') {
      const [usersRes, shopsRes, salesRes, blockedRes] = await Promise.all([
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('shops').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('sales').select('total'),
        supabaseAdmin.from('shops').select('*', { count: 'exact', head: true }).eq('is_blocked', true),
      ]);
      return NextResponse.json({
        totalUsers: usersRes.count || 0,
        totalShops: shopsRes.count || 0,
        blockedShops: blockedRes.count || 0,
        totalSales: (salesRes.data || []).reduce((s, x) => s + Number(x.total || 0), 0),
      });
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
  } catch (e) {
    console.error('Admin GET error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── PATCH ─────────────────────────────────────────────────
export async function PATCH(req) {
  const user = getUserFromRequest(req);
  const denied = adminOnly(user);
  if (denied) return denied;

  try {
    const { action, shopId, userId, reason } = await req.json();

    // ── NID যাচাই ──
    if (action === 'verify_nid') {
      if (userId) await supabaseAdmin.from('users').update({ nid_verified: true }).eq('id', userId);
      if (shopId) await supabaseAdmin.from('shops').update({ nid_verified: true }).eq('id', shopId);
      return NextResponse.json({ success: true, message: 'NID যাচাই হয়েছে' });
    }

    // ── দোকান ব্লক ──
    if (action === 'block' && shopId) {
      // BUG FIX: owner_id আগেই পড়ো, delete-এর পরে না
      const { data: shopData } = await supabaseAdmin
        .from('shops').select('owner_id').eq('id', shopId).single();

      await supabaseAdmin.from('shops')
        .update({ is_blocked: true, blocked_reason: reason || null }).eq('id', shopId);

      if (shopData?.owner_id) {
        await supabaseAdmin.from('users')
          .update({ is_blocked: true }).eq('id', shopData.owner_id);
      }
      return NextResponse.json({ success: true, message: 'ব্লক হয়েছে' });
    }

    // ── দোকান আনব্লক ──
    if (action === 'unblock' && shopId) {
      const { data: shopData } = await supabaseAdmin
        .from('shops').select('owner_id').eq('id', shopId).single();

      await supabaseAdmin.from('shops')
        .update({ is_blocked: false, blocked_reason: null }).eq('id', shopId);

      if (shopData?.owner_id) {
        await supabaseAdmin.from('users')
          .update({ is_blocked: false }).eq('id', shopData.owner_id);
      }
      return NextResponse.json({ success: true, message: 'আনব্লক হয়েছে' });
    }

    // ── শুধু user ব্লক (shop ছাড়া) ──
    if (action === 'block' && userId && !shopId) {
      await supabaseAdmin.from('users').update({ is_blocked: true }).eq('id', userId);
      return NextResponse.json({ success: true });
    }
    if (action === 'unblock' && userId && !shopId) {
      await supabaseAdmin.from('users').update({ is_blocked: false }).eq('id', userId);
      return NextResponse.json({ success: true });
    }

    // ── দোকান মুছুন ──
    if (action === 'delete_shop' && shopId) {
      // BUG FIX: আগে owner_id পড়ো, তারপর shop মুছো
      const { data: shopData } = await supabaseAdmin
        .from('shops').select('owner_id').eq('id', shopId).single();

      // Shop মুছলে CASCADE-এ সব related data মুছে যাবে (schema তে আছে)
      const { error: delErr } = await supabaseAdmin.from('shops').delete().eq('id', shopId);
      if (delErr) throw delErr;

      // User ও মুছুন (যদি userId পাস করা হয় বা shopData থেকে পাই)
      const ownerToDelete = userId || shopData?.owner_id;
      if (ownerToDelete) {
        await supabaseAdmin.from('users').delete().eq('id', ownerToDelete);
      }
      return NextResponse.json({ success: true, message: 'দোকান মুছে ফেলা হয়েছে' });
    }

    // ── User মুছুন ──
    if (action === 'delete_user' && userId) {
      // নিজেকে মুছতে পারবে না
      if (userId === user.userId)
        return NextResponse.json({ error: 'নিজের একাউন্ট মুছা যাবে না' }, { status: 400 });
      const { error: delErr } = await supabaseAdmin.from('users').delete().eq('id', userId);
      if (delErr) throw delErr;
      return NextResponse.json({ success: true, message: 'ব্যবহারকারী মুছে ফেলা হয়েছে' });
    }

    // ── অনলাইন যাচাই ──
    if (action === 'verify_online' && shopId) {
      await supabaseAdmin.from('shops').update({
        online_verified: true,
        online_verified_at: new Date().toISOString(),
      }).eq('id', shopId);
      return NextResponse.json({ success: true, message: 'অনলাইন যাচাই হয়েছে' });
    }

    // ── সাবস্ক্রিপশন পরিবর্তন ──
    if (action === 'change_plan' && shopId) {
      const validPlans = ['free', 'basic', 'premium'];
      if (!validPlans.includes(reason))
        return NextResponse.json({ error: 'Invalid plan. Use: free, basic, premium' }, { status: 400 });
      await supabaseAdmin.from('shops').update({ subscription_plan: reason }).eq('id', shopId);
      return NextResponse.json({ success: true, message: `Plan → ${reason}` });
    }

    // ── Active/Inactive toggle ──
    if (action === 'toggle_active' && shopId) {
      const { data: s } = await supabaseAdmin.from('shops').select('is_active').eq('id', shopId).single();
      await supabaseAdmin.from('shops').update({ is_active: !s.is_active }).eq('id', shopId);
      return NextResponse.json({ success: true });
    }

    // ── Role পরিবর্তন ──
    if (action === 'change_role' && userId) {
      const validRoles = ['owner', 'manager', 'cashier', 'stock_manager', 'viewer'];
      if (!validRoles.includes(reason))
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      await supabaseAdmin.from('users').update({ role: reason }).eq('id', userId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action: ' + action }, { status: 400 });

  } catch (e) {
    console.error('Admin PATCH error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
