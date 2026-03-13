'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useLang } from '@/lib/store';
import AppShell from '@/components/layout/AppShell';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import api from '@/lib/api';
import Link from 'next/link';

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div style={{ background:'white', borderRadius:'16px', padding:'16px', boxShadow:'0 2px 10px rgba(15,40,80,0.06)', flex:1 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <p style={{ margin:0, fontSize:'11px', color:'#8A9AB5', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.4px' }}>{label}</p>
          <p style={{ margin:'6px 0 0', fontSize:'22px', fontWeight:'800', color:'#141D28' }}>{value}</p>
          {sub && <p style={{ margin:'2px 0 0', fontSize:'11px', color:'#8A9AB5' }}>{sub}</p>}
        </div>
        <div style={{ width:'40px', height:'40px', background:color+'20', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>{icon}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, shop, token } = useAuthStore();
  const { t } = useLang();
  const [stats, setStats] = useState(null);
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dash, report] = await Promise.all([
        api.get('/api/dashboard'),
        api.get('/api/reports?type=overview'),
      ]);
      setStats(dash);
      setChart(report.monthlyChart || []);
    } catch(e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const fmt = (n) => `৳${Number(n||0).toLocaleString('bn-BD')}`;

  if (loading) return (
    <AppShell title={t('ড্যাশবোর্ড','Dashboard')}>
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh' }}>
        <div className="spin" style={{ width:'40px',height:'40px',border:'3px solid #DDE4EE',borderTopColor:'#0F4C81',borderRadius:'50%' }} />
      </div>
    </AppShell>
  );

  return (
    <AppShell title={t('ড্যাশবোর্ড','Dashboard')}>
      <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'14px' }}>

        {error && <div style={{ background:'#FDECEA', border:'1px solid #E63946', borderRadius:'12px', padding:'12px', fontSize:'13px', color:'#E63946' }}>⚠️ {error} <button onClick={loadData} style={{ marginLeft:'8px', background:'none', border:'none', color:'#0F4C81', cursor:'pointer', fontWeight:'600' }}>রিফ্রেশ</button></div>}

        {/* Welcome */}
        <div style={{ background:'linear-gradient(135deg,#0F4C81,#2E86DE)', borderRadius:'18px', padding:'18px', color:'white' }}>
          <p style={{ margin:0, fontSize:'13px', opacity:0.8 }}>স্বাগতম, {user?.full_name?.split(' ')[0]} 👋</p>
          <p style={{ margin:'4px 0 0', fontSize:'17px', fontWeight:'700' }}>{shop?.shop_name || 'আপনার দোকান'}</p>
          <p style={{ margin:'2px 0 0', fontSize:'12px', opacity:0.7 }}>{new Date().toLocaleDateString('bn-BD', { weekday:'long', day:'numeric', month:'long' })}</p>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:'10px' }}>
          <StatCard label={t('আজকের বিক্রয়','Today Sales')} value={fmt(stats?.todaySales)} icon="💰" color="#0F4C81" sub={`${stats?.totalOrders||0} টি অর্ডার`} />
          <StatCard label={t('আজকের লাভ','Today Profit')} value={fmt(stats?.todayProfit)} icon="📈" color="#0BAA69" />
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
          <StatCard label={t('মোট পণ্য','Products')} value={stats?.totalProducts||0} icon="📦" color="#8B5CF6" sub={`${stats?.lowStockCount||0} কম স্টক`} />
          <StatCard label={t('বাকি পাওনা','Due Amount')} value={fmt(stats?.totalDue)} icon="⏳" color="#E63946" />
        </div>

        {/* Low Stock Alert */}
        {(stats?.outOfStockCount > 0 || stats?.lowStockCount > 0) && (
          <Link href="/inventory?filter=lowStock" style={{ textDecoration:'none' }}>
            <div style={{ background:'#FFF3E0', border:'1px solid #F4A261', borderRadius:'14px', padding:'14px', display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ fontSize:'24px' }}>⚠️</span>
              <div>
                <p style={{ margin:0, fontWeight:'700', color:'#B45309', fontSize:'14px' }}>স্টক সতর্কতা</p>
                <p style={{ margin:'2px 0 0', fontSize:'12px', color:'#92400E' }}>{stats?.outOfStockCount||0} পণ্য শেষ • {stats?.lowStockCount||0} পণ্য কম</p>
              </div>
              <span style={{ marginLeft:'auto', color:'#B45309' }}>→</span>
            </div>
          </Link>
        )}

        {/* Quick Actions */}
        <div>
          <p style={{ margin:'0 0 10px', fontWeight:'700', color:'#141D28', fontSize:'14px' }}>দ্রুত কাজ</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            {[
              { icon:'🛒', label:'নতুন বিক্রয়', href:'/pos', color:'#0F4C81' },
              { icon:'📦', label:'পণ্য যোগ',    href:'/inventory?action=add', color:'#0BAA69' },
              { icon:'👥', label:'গ্রাহক',       href:'/customers', color:'#8B5CF6' },
              { icon:'📊', label:'রিপোর্ট',     href:'/reports', color:'#E63946' },
            ].map(a => (
              <Link key={a.href} href={a.href} style={{ textDecoration:'none' }}>
                <div style={{ background:'white', borderRadius:'14px', padding:'16px', display:'flex', alignItems:'center', gap:'12px', boxShadow:'0 2px 8px rgba(15,40,80,0.06)' }}>
                  <div style={{ width:'38px', height:'38px', background:a.color+'18', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>{a.icon}</div>
                  <span style={{ fontWeight:'600', fontSize:'13px', color:'#141D28' }}>{a.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Chart */}
        {chart.length > 0 && (
          <div style={{ background:'white', borderRadius:'16px', padding:'16px', boxShadow:'0 2px 10px rgba(15,40,80,0.06)' }}>
            <p style={{ margin:'0 0 14px', fontWeight:'700', fontSize:'14px', color:'#141D28' }}>মাসিক বিক্রয়</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chart}>
                <XAxis dataKey="name" tick={{ fontSize:11, fill:'#8A9AB5' }} />
                <YAxis hide />
                <Tooltip formatter={v=>`৳${v.toLocaleString()}`} />
                <Bar dataKey="value" fill="#2E86DE" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Sales */}
        {stats?.recentSales?.length > 0 && (
          <div style={{ background:'white', borderRadius:'16px', padding:'16px', boxShadow:'0 2px 10px rgba(15,40,80,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
              <p style={{ margin:0, fontWeight:'700', fontSize:'14px', color:'#141D28' }}>সাম্প্রতিক বিক্রয়</p>
              <Link href="/sales" style={{ fontSize:'12px', color:'#2E86DE', fontWeight:'600', textDecoration:'none' }}>সব দেখুন →</Link>
            </div>
            {stats.recentSales.map(s => (
              <Link key={s.id} href={`/receipt/${s.id}`} style={{ textDecoration:'none' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #F0F4F8' }}>
                  <div>
                    <p style={{ margin:0, fontSize:'13px', fontWeight:'600', color:'#141D28' }}>{s.customers?.name||'সাধারণ গ্রাহক'}</p>
                    <p style={{ margin:'2px 0 0', fontSize:'11px', color:'#8A9AB5' }}>{s.invoice_number}</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ margin:0, fontWeight:'700', color:'#141D28', fontSize:'14px' }}>{fmt(s.total)}</p>
                    <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'20px', fontWeight:'600',
                      background: s.status==='completed'?'#D1FAE5':s.status==='due'?'#FEE2E2':'#FEF3C7',
                      color: s.status==='completed'?'#065F46':s.status==='due'?'#991B1B':'#92400E' }}>
                      {s.status==='completed'?'পরিশোধ':s.status==='due'?'বাকি':'আংশিক'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
