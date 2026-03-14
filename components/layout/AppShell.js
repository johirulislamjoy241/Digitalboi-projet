'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Icon, Avatar } from '@/components/ui';

const NAV_ITEMS = [
  { href: '/dashboard',  icon: 'home',  label: 'হোম' },
  { href: '/pos',        icon: 'pos',   label: 'বিক্রয়', fab: true },
  { href: '/inventory',  icon: 'box',   label: 'স্টক' },
  { href: '/customers',  icon: 'users', label: 'গ্রাহক' },
  { href: '/more',       icon: 'menu',  label: 'আরও' },
];

function TopBar({ title, showBack, action }) {
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <div style={{
      background: 'var(--surface)', padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 50,
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      {showBack && (
        <button
          onClick={() => router.back()}
          style={{ background: 'rgba(255,87,34,0.1)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: 'var(--brand)', display: 'flex' }}
        >
          <Icon name="back" size={18} />
        </button>
      )}
      <div style={{ flex: 1 }}>
        <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.3 }}>{title}</h1>
      </div>
      {action}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-sub)' }}>
            <Icon name="bell" size={22} />
            <span style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%', border: '2px solid #fff' }} />
          </button>
          <Avatar name={user.fullName || user.shopName || 'U'} size={36} />
        </div>
      )}
    </div>
  );
}

function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href) => {
    if (href === '/more') {
      return !['/dashboard', '/pos', '/inventory', '/customers'].some(p => pathname.startsWith(p));
    }
    return pathname.startsWith(href);
  };

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      background: 'var(--surface)', borderTop: '1px solid var(--border)',
      display: 'flex', zIndex: 90,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
    }}>
      {NAV_ITEMS.map(item => {
        const active = isActive(item.href);
        if (item.fab) return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer', paddingBottom: 8, paddingTop: 4 }}
          >
            <div style={{
              width: 54, height: 54, borderRadius: '50%',
              background: 'var(--brand-grad)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: -22, boxShadow: '0 4px 16px rgba(255,87,34,0.5)',
              color: '#fff',
            }}>
              <Icon name="pos" size={22} color="#fff" />
            </div>
          </button>
        );
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, padding: '10px 4px 8px', border: 'none', background: 'none',
              cursor: 'pointer', color: active ? 'var(--brand)' : 'var(--text-muted)',
              transition: 'color 0.2s', position: 'relative',
            }}
          >
            <Icon name={item.icon} size={22} />
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{item.label}</span>
            {active && (
              <span style={{ position: 'absolute', bottom: 0, width: 20, height: 3, background: 'var(--brand)', borderRadius: '3px 3px 0 0' }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function AppShell({ title, children, showBack = false, action }) {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 430, minHeight: '100dvh', background: 'var(--bg)', position: 'relative', boxShadow: '0 0 60px rgba(0,0,0,0.12)' }}>
        <TopBar title={title} showBack={showBack} action={action} />
        <div style={{ paddingBottom: 90, animation: 'fadeUp 0.25s ease' }}>
          {children}
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
