"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function Page() {
  const router = useRouter();
  useEffect(() => { router.replace("/"); }, [router]);
  return null;
}

const tabs = [
  { k: 'overview', label: '📊 ওভারভিউ' },
  { k: 'shops', label: '🏪 দোকান' },
  { k: 'users', label: '👥 ব্যবহারকারী' },
  { k: 'sales', label: '💰 বিক্রয়' },
];

export default function AdminPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [shops, setShops] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => { if (user?.role === 'super_admin') loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, u, st] = await Promise.all([
        api.get('/api/admin?type=shops'),
        api.get('/api/admin?type=users'),
        api.get('/api/admin?type=stats'),
      ]);
      setShops(s || []);
      setUsers(u || []);
      setStats(st);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const doAction = async (action, shopId, userId, reason = '') => {
    setActionLoading(true);
    try {
      await api.patch('/api/admin', { action, shopId, userId, reason });
      const msgs = {
        verify_nid: 'NID যাচাই হয়েছে ✓',
        block: 'ব্লক করা হয়েছে',
        unblock: 'আনব্লক করা হয়েছে ✓',
        delete_user: 'মুছে ফেলা হয়েছে',
        delete_shop: 'দোকান মুছে ফেলা হয়েছে',
        verify_online: 'অনলাইন যাচাই হয়েছে ✓',
        change_plan: 'সাবস্ক্রিপশন আপডেট হয়েছে ✓',
        toggle_active: 'স্ট্যাটাস পরিবর্তন হয়েছে',
      };
      showToast(msgs[action] || 'সম্পন্ন হয়েছে');
      loadAll(); setSelected(null); setConfirmDelete(null); setBlockReason('');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setActionLoading(false); }
  };

  if (!user || user.role !== 'super_admin') {
    return (
      <AppShell title="অ্যাডমিন">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⛔</div>
          <h2 style={{ color: '#E63946', fontSize: '18px' }}>অ্যাক্সেস নিষিদ্ধ</h2>
          <p style={{ color: '#5E6E8A', fontSize: '14px' }}>শুধুমাত্র Super Admin এই পেজটি দেখতে পারবেন</p>
        </div>
      </AppShell>
    );
  }

  const fmt = n => `৳${Number(n || 0).toLocaleString('bn-BD')}`;
  const filterShops = shops.filter(s =>
    s.shop_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.users?.phone?.includes(search) ||
    s.district?.toLowerCase().includes(search.toLowerCase())
  );
  const filterUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const StatusBadge = ({ cond, yes, no }) => (
    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '700', background: cond ? '#D1FAE5' : '#FEE2E2', color: cond ? '#065F46' : '#991B1B' }}>
      {cond ? yes : no}
    </span>
  );

  return (
    <AppShell title="👑 Super Admin">
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)', background: toast.type === 'error' ? '#E63946' : '#0BAA69', color: 'white', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast.msg}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', maxWidth: '320px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#141D28' }}>নিশ্চিত করুন</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#5E6E8A' }}>{confirmDelete.msg}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '10px', border: '2px solid #DDE4EE', borderRadius: '10px', background: 'white', cursor: 'pointer', fontWeight: '600', color: '#5E6E8A', fontFamily: 'inherit', fontSize: '13px' }}>বাতিল</button>
              <button onClick={() => doAction(confirmDelete.action, confirmDelete.shopId, confirmDelete.userId)}
                disabled={actionLoading}
                style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '10px', background: '#E63946', color: 'white', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit', fontSize: '13px' }}>
                {actionLoading ? '⏳...' : 'হ্যাঁ, মুছুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {tabs.map(t => (
            <button key={t.k} onClick={() => { setActiveTab(t.k); setSearch(''); setSelected(null); }}
              style={{ padding: '8px 14px', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', background: activeTab === t.k ? '#0F4C81' : 'white', color: activeTab === t.k ? 'white' : '#5E6E8A', boxShadow: '0 2px 8px rgba(15,40,80,0.08)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <>
            {stats ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { l: 'মোট ব্যবহারকারী', v: stats.totalUsers, icon: '👥', c: '#0F4C81' },
                  { l: 'মোট দোকান', v: stats.totalShops, icon: '🏪', c: '#0BAA69' },
                  { l: 'মোট বিক্রয়', v: fmt(stats.totalSales), icon: '💰', c: '#8B5CF6' },
                  { l: 'ব্লকড শপ', v: shops.filter(s => s.is_blocked).length, icon: '🚫', c: '#E63946' },
                ].map(({ l, v, icon, c }) => (
                  <div key={l} style={{ background: 'white', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(15,40,80,0.06)', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>{icon}</div>
                    <p style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: c }}>{v}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#8A9AB5' }}>{l}</p>
                  </div>
                ))}
              </div>
            ) : loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8A9AB5' }}>⏳ লোড হচ্ছে...</div>
            ) : null}

            {/* Recent shops */}
            <div style={{ background: 'white', borderRadius: '14px', padding: '14px', boxShadow: '0 2px 8px rgba(15,40,80,0.06)' }}>
              <p style={{ margin: '0 0 12px', fontWeight: '800', fontSize: '14px', color: '#141D28' }}>সাম্প্রতিক নিবন্ধন</p>
              {shops.slice(0, 5).map(shop => (
                <div key={shop.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F0F4F8' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#141D28' }}>{shop.shop_name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#8A9AB5' }}>{shop.users?.phone} • {shop.district}</p>
                  </div>
                  <StatusBadge cond={!shop.is_blocked} yes="সক্রিয়" no="ব্লক" />
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── SHOPS ── */}
        {activeTab === 'shops' && (
          <>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 দোকান, মালিক, জেলা খুঁজুন..."
              style={{ width: '100%', padding: '12px 14px', border: '2px solid #E8EDF5', borderRadius: '12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: "'Hind Siliguri',sans-serif" }} />

            {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#8A9AB5' }}>⏳ লোড হচ্ছে...</div> :
              filterShops.map(shop => {
                const owner = shop.users;
                const isOpen = selected?.id === shop.id;
                return (
                  <div key={shop.id} style={{ background: 'white', borderRadius: '14px', padding: '14px', boxShadow: '0 2px 8px rgba(15,40,80,0.06)', border: shop.is_blocked ? '2px solid #E63946' : isOpen ? '2px solid #0F4C81' : '2px solid transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#141D28' }}>{shop.shop_name}</p>
                          {shop.is_blocked && <span style={{ fontSize: '10px', background: '#FEE2E2', color: '#E63946', borderRadius: '8px', padding: '2px 8px', fontWeight: '700' }}>🚫 ব্লক</span>}
                          {owner?.nid_verified && <span style={{ fontSize: '10px', background: '#D1FAE5', color: '#065F46', borderRadius: '8px', padding: '2px 8px', fontWeight: '700' }}>✓ NID</span>}
                          {shop.online_verified && <span style={{ fontSize: '10px', background: '#EDE9FE', color: '#5B21B6', borderRadius: '8px', padding: '2px 8px', fontWeight: '700' }}>🌐 যাচাই</span>}
                          <span style={{ fontSize: '10px', background: '#F0F4F8', color: '#5E6E8A', borderRadius: '8px', padding: '2px 8px' }}>
                            {shop.business_type === 'physical' ? '🏪' : '🌐'} {shop.subscription_plan || 'free'}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', color: '#5E6E8A' }}>
                          {shop.district || '—'} • {new Date(shop.created_at).toLocaleDateString('bn-BD')}
                        </p>
                        {shop.address && <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#8A9AB5' }}>📍 {shop.address.substring(0, 60)}{shop.address.length > 60 ? '...' : ''}</p>}
                      </div>
                      <button onClick={() => setSelected(isOpen ? null : shop)}
                        style={{ padding: '6px 12px', border: 'none', background: isOpen ? '#0F4C81' : '#F0F4F8', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: isOpen ? 'white' : '#5E6E8A', fontFamily: 'inherit', flexShrink: 0, marginLeft: '8px' }}>
                        {isOpen ? '✕' : 'বিস্তারিত'}
                      </button>
                    </div>

                    {/* মালিকের তথ্য */}
                    {owner && (
                      <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px' }}>
                        <p style={{ margin: 0, fontWeight: '700', fontSize: '13px', color: '#141D28' }}>{owner.full_name}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#5E6E8A' }}>📞 {owner.phone}{owner.email ? ` • ✉️ ${owner.email}` : ''}</p>
                        {owner.nid_number && <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#5E6E8A' }}>🪪 NID: {owner.nid_number}</p>}
                      </div>
                    )}

                    {/* বিস্তারিত / Actions */}
                    {isOpen && (
                      <div style={{ marginTop: '12px' }}>
                        {/* NID Photos */}
                        {(owner?.nid_front_photo || owner?.nid_back_photo) && (
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            {owner.nid_front_photo && <img src={owner.nid_front_photo} style={{ flex: 1, height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #DDE4EE' }} alt="NID সামনে" />}
                            {owner.nid_back_photo && <img src={owner.nid_back_photo} style={{ flex: 1, height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #DDE4EE' }} alt="NID পেছনে" />}
                          </div>
                        )}

                        {/* দোকানের ছবি */}
                        {shop.shop_photos?.length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', overflowX: 'auto' }}>
                            {shop.shop_photos.map((p, i) => (
                              <img key={i} src={p} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0, border: '1px solid #DDE4EE' }} alt="" />
                            ))}
                          </div>
                        )}

                        {/* Block কারণ */}
                        {!shop.is_blocked && (
                          <div style={{ marginBottom: '10px' }}>
                            <input value={blockReason} onChange={e => setBlockReason(e.target.value)}
                              placeholder="ব্লকের কারণ (ব্লক করতে হলে)"
                              style={{ width: '100%', padding: '10px', border: '2px solid #E8EDF5', borderRadius: '10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {!owner?.nid_verified && (
                            <button onClick={() => doAction('verify_nid', shop.id, owner?.id)} disabled={actionLoading}
                              style={{ padding: '10px', border: 'none', borderRadius: '10px', background: '#0BAA69', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: 'inherit' }}>
                              ✓ NID যাচাই
                            </button>
                          )}
                          {shop.business_type !== 'physical' && !shop.online_verified && (
                            <button onClick={() => doAction('verify_online', shop.id)} disabled={actionLoading}
                              style={{ padding: '10px', border: 'none', borderRadius: '10px', background: '#8B5CF6', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: 'inherit' }}>
                              🌐 অনলাইন যাচাই
                            </button>
                          )}
                          {shop.is_blocked ? (
                            <button onClick={() => doAction('unblock', shop.id, owner?.id)} disabled={actionLoading}
                              style={{ padding: '10px', border: 'none', borderRadius: '10px', background: '#0BAA69', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: 'inherit' }}>
                              ✓ আনব্লক
                            </button>
                          ) : (
                            <button onClick={() => doAction('block', shop.id, owner?.id, blockReason)} disabled={actionLoading}
                              style={{ padding: '10px', border: 'none', borderRadius: '10px', background: '#F59E0B', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: 'inherit' }}>
                              🚫 ব্লক করুন
                            </button>
                          )}
                          <button onClick={() => setConfirmDelete({ action: 'delete_shop', shopId: shop.id, userId: owner?.id, msg: `"${shop.shop_name}" এবং সংশ্লিষ্ট সব ডেটা মুছে যাবে। নিশ্চিত?` })}
                            style={{ padding: '10px', border: 'none', borderRadius: '10px', background: '#E63946', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: 'inherit', gridColumn: 'span 2' }}>
                            🗑️ দোকান মুছুন
                          </button>
                        </div>

                        {/* সাবস্ক্রিপশন পরিবর্তন */}
                        <div style={{ marginTop: '10px' }}>
                          <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: '700', color: '#5E6E8A' }}>সাবস্ক্রিপশন প্ল্যান:</p>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {['free', 'basic', 'premium'].map(plan => (
                              <button key={plan} onClick={() => doAction('change_plan', shop.id, null, plan)}
                                style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', background: shop.subscription_plan === plan ? '#0F4C81' : '#F0F4F8', color: shop.subscription_plan === plan ? 'white' : '#5E6E8A', cursor: 'pointer', fontSize: '11px', fontWeight: '700', fontFamily: 'inherit' }}>
                                {plan}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            }

            {!loading && filterShops.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8A9AB5' }}>কোনো দোকান পাওয়া যায়নি</div>
            )}
          </>
        )}

        {/* ── USERS ── */}
        {activeTab === 'users' && (
          <>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 নাম, ফোন বা ইমেইল দিয়ে খুঁজুন..."
              style={{ width: '100%', padding: '12px 14px', border: '2px solid #E8EDF5', borderRadius: '12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: "'Hind Siliguri',sans-serif" }} />

            {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#8A9AB5' }}>⏳ লোড হচ্ছে...</div> :
              filterUsers.map(u => (
                <div key={u.id} style={{ background: 'white', borderRadius: '14px', padding: '14px', boxShadow: '0 2px 8px rgba(15,40,80,0.06)', border: u.is_blocked ? '2px solid #E63946' : '2px solid transparent' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#141D28' }}>{u.full_name}</p>
                        {u.is_blocked && <span style={{ fontSize: '10px', background: '#FEE2E2', color: '#E63946', borderRadius: '8px', padding: '2px 8px', fontWeight: '700' }}>🚫 ব্লক</span>}
                        {u.nid_verified && <span style={{ fontSize: '10px', background: '#D1FAE5', color: '#065F46', borderRadius: '8px', padding: '2px 8px', fontWeight: '700' }}>✓ NID</span>}
                        <span style={{ fontSize: '10px', background: '#EDE9FE', color: '#5B21B6', borderRadius: '8px', padding: '2px 8px', fontWeight: '700' }}>{u.role}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#5E6E8A' }}>📞 {u.phone}{u.email ? ` • ${u.email}` : ''}</p>
                      {u.nid_number && <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#8A9AB5' }}>NID: {u.nid_number}</p>}
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#8A9AB5' }}>যোগদান: {new Date(u.created_at).toLocaleDateString('bn-BD')}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    {!u.nid_verified && u.nid_number && (
                      <button onClick={() => doAction('verify_nid', null, u.id)}
                        style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', background: '#0BAA69', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: 'inherit' }}>
                        ✓ NID যাচাই
                      </button>
                    )}
                    {u.is_blocked ? (
                      <button onClick={() => doAction('unblock', null, u.id)}
                        style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', background: '#0BAA69', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: 'inherit' }}>
                        আনব্লক
                      </button>
                    ) : (
                      <button onClick={() => doAction('block', null, u.id)}
                        style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', background: '#F59E0B', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: 'inherit' }}>
                        🚫 ব্লক
                      </button>
                    )}
                    {u.id !== user.id && (
                      <button onClick={() => setConfirmDelete({ action: 'delete_user', userId: u.id, msg: `"${u.full_name}" একাউন্ট স্থায়ীভাবে মুছে যাবে?` })}
                        style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', background: '#E63946', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: 'inherit' }}>
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))
            }
            {!loading && filterUsers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8A9AB5' }}>কোনো ব্যবহারকারী পাওয়া যায়নি</div>
            )}
          </>
        )}

        {/* ── SALES ── */}
        {activeTab === 'sales' && (
          <div style={{ background: 'white', borderRadius: '14px', padding: '14px', boxShadow: '0 2px 8px rgba(15,40,80,0.06)' }}>
            <p style={{ margin: '0 0 12px', fontWeight: '800', color: '#141D28' }}>বিক্রয় তথ্য (শীঘ্রই আসছে)</p>
            <p style={{ color: '#8A9AB5', fontSize: '13px' }}>সব দোকানের বিক্রয় রিপোর্ট এখানে দেখা যাবে।</p>
          </div>
        )}

      </div>
    </AppShell>
  );
}
