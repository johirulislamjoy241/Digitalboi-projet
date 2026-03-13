'use client';
import { useState, useEffect } from 'react';
import { useAuthStore, useToastStore } from '@/lib/store';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { id:'dashboard', label:'হোম',     icon:'🏠', href:'/dashboard' },
  { id:'pos',       label:'বিক্রয়', icon:'🛒', href:'/pos' },
  { id:'inventory', label:'পণ্য',    icon:'📦', href:'/inventory' },
  { id:'customers', label:'গ্রাহক',  icon:'👥', href:'/customers' },
  { id:'more',      label:'আরো',     icon:'☰',  href:'#' },
];

const MORE_ITEMS = [
  { label:'বিক্রয় ইতিহাস', icon:'📋', href:'/sales',        color:'#4361EE' },
  { label:'স্টক সমন্বয়',   icon:'🔄', href:'/stock',        color:'#0BAA69' },
  { label:'সরবরাহকারী',     icon:'🏭', href:'/suppliers',    color:'#F4A261' },
  { label:'হিসাব/খরচ',      icon:'💵', href:'/accounts',     color:'#0F4C81' },
  { label:'রিপোর্ট',        icon:'📊', href:'/reports',      color:'#8B5CF6' },
  { label:'ক্যাটাগরি',     icon:'🏷️', href:'/categories',   color:'#0BAA69' },
  { label:'নোটিফিকেশন',    icon:'🔔', href:'/notifications', color:'#E63946' },
  { label:'প্রোফাইল',      icon:'👤', href:'/profile',       color:'#5E6E8A' },
  { label:'সেটিংস',        icon:'⚙️', href:'/settings',     color:'#5E6E8A' },
  { label:'অ্যাডমিন',      icon:'🛡️', href:'/admin',        color:'#E63946', adminOnly:true },
];

function Toast({ toast }) {
  const colors = { success:['#D1FAE5','#065F46','#0BAA69'], error:['#FEE2E2','#991B1B','#E63946'], info:['#DBEAFE','#1E40AF','#2E86DE'] };
  const [bg,text,border] = colors[toast.type]||colors.info;
  return (
    <div style={{ background:bg, color:text, border:`1px solid ${border}`, borderRadius:'12px', padding:'12px 16px', marginBottom:'8px', fontSize:'13px', fontWeight:'600', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', display:'flex', alignItems:'center', gap:'8px' }}>
      <span>{toast.type==='success'?'✅':toast.type==='error'?'❌':'ℹ️'}</span>
      {toast.msg}
    </div>
  );
}

export default function AppShell({ children, title }) {
  const { user, shop, lang, setLang, logout } = useAuthStore();
  const { toasts } = useToastStore();
  const pathname = usePathname();
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  const activeTab = NAV.find(n => n.href !== '#' && pathname.startsWith(n.href))?.id || 'more';

  useEffect(() => {
    if (user?.role !== 'super_admin') {
      // Load unread notifications count
      fetch('/api/notifications', { headers: { Authorization: (() => { const m = document.cookie.split(';').find(c=>c.trim().startsWith('digiboi_token=')); if(!m) return ''; const i=m.indexOf('='); return 'Bearer '+(i!==-1?m.substring(i+1).trim():''); })() } })
        .then(r => r.json())
        .then(data => setNotifCount(Array.isArray(data) ? data.filter(n=>!n.is_read).length : 0))
        .catch(()=>{});
    }
  }, [pathname]);

  return (
    <div style={{ maxWidth:'480px', margin:'0 auto', height:'100vh', display:'flex', flexDirection:'column', background:'#F4F7FB', fontFamily:"'Hind Siliguri',sans-serif", position:'relative', overflow:'hidden' }}>

      {/* Toast Notifications */}
      <div style={{ position:'fixed', top:'16px', left:'50%', transform:'translateX(-50%)', zIndex:9999, width:'calc(100% - 32px)', maxWidth:'448px' }}>
        {toasts.map(t => <Toast key={t.id} toast={t} />)}
      </div>

      {/* Header */}
      <div style={{ background:'white', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #F0F4F8', boxShadow:'0 2px 10px rgba(15,40,80,0.06)', flexShrink:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'34px', height:'34px', background:'linear-gradient(135deg,#0F4C81,#2E86DE)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'white', fontWeight:'800', fontSize:'16px' }}>D</span>
          </div>
          <div>
            <p style={{ margin:0, fontSize:'14px', fontWeight:'700', color:'#141D28', lineHeight:1.2 }}>{title}</p>
            <p style={{ margin:0, fontSize:'10px', color:'#8A9AB5' }}>{user?.role==='super_admin'?'👑 Super Admin':'🏪 '+(shop?.shop_name||'দোকান')}</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <button onClick={()=>setLang(lang==='bn'?'en':'bn')} style={{ padding:'4px 10px', background:'#F0F4F8', border:'none', borderRadius:'20px', fontSize:'11px', fontWeight:'600', cursor:'pointer', color:'#5E6E8A', fontFamily:'inherit' }}>{lang==='bn'?'EN':'বাং'}</button>
          <Link href="/notifications">
            <button style={{ width:'34px', height:'34px', background:'#F0F4F8', border:'none', borderRadius:'10px', cursor:'pointer', fontSize:'16px', position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
              🔔
              {notifCount > 0 && <span style={{ position:'absolute', top:'4px', right:'4px', width:'16px', height:'16px', background:'#E63946', borderRadius:'50%', border:'1.5px solid white', fontSize:'9px', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700' }}>{notifCount}</span>}
            </button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>
        {children}
      </div>

      {/* Bottom Nav */}
      <div style={{ background:'white', borderTop:'1px solid #F0F4F8', display:'flex', flexShrink:0, boxShadow:'0 -4px 16px rgba(15,40,80,0.08)', zIndex:100 }}>
        {NAV.map(n => {
          const isActive = activeTab === n.id;
          return (
            <button key={n.id} onClick={() => { if (n.href === '#') setShowMore(s=>!s); else { setShowMore(false); router.push(n.href); } }}
              style={{ flex:1, padding:'10px 4px 8px', border:'none', background:'transparent', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px' }}>
              <span style={{ fontSize:'20px', opacity: isActive ? 1 : 0.6 }}>{n.icon}</span>
              <span style={{ fontSize:'10px', fontWeight:isActive?'700':'500', color:isActive?'#0F4C81':'#8A9AB5', fontFamily:'inherit' }}>{n.label}</span>
              {isActive && <div style={{ width:'20px', height:'3px', background:'#0F4C81', borderRadius:'2px' }} />}
            </button>
          );
        })}
      </div>

      {/* More Menu */}
      {showMore && (
        <div style={{ position:'absolute', bottom:'70px', left:0, right:0, background:'white', borderRadius:'24px 24px 0 0', boxShadow:'0 -8px 32px rgba(15,40,80,0.15)', zIndex:200, padding:'20px' }} onClick={e=>e.stopPropagation()}>
          <div style={{ width:'40px', height:'4px', background:'#DDE4EE', borderRadius:'4px', margin:'0 auto 16px' }} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            {MORE_ITEMS.filter(m=>!m.adminOnly||(user?.role==='super_admin')).map(item=>(
              <Link key={item.href} href={item.href} onClick={()=>setShowMore(false)} style={{ textDecoration:'none' }}>
                <div style={{ background:'#F8FAFC', borderRadius:'14px', padding:'14px', display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'36px', height:'36px', background:item.color+'18', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>{item.icon}</div>
                  <span style={{ fontSize:'12px', fontWeight:'600', color:'#141D28' }}>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
          <button onClick={logout} style={{ width:'100%', marginTop:'14px', padding:'13px', border:'2px solid #E63946', borderRadius:'14px', background:'#FEE2E2', color:'#E63946', fontWeight:'700', cursor:'pointer', fontSize:'14px', fontFamily:'inherit' }}>🚪 লগআউট</button>
        </div>
      )}

      {showMore && <div style={{ position:'absolute', inset:0, zIndex:199 }} onClick={()=>setShowMore(false)} />}
    </div>
  );
}
