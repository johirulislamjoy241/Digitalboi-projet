'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';

// Register-এর মতোই normalize
function normalizePhone(phone) {
  const clean = phone.replace(/[\s\-()+]/g, '');
  if (clean.startsWith('+880')) return clean;
  if (clean.startsWith('880'))  return '+' + clean;
  if (clean.startsWith('0'))    return '+88' + clean;
  if (/^1[3-9]\d{8}$/.test(clean)) return '+880' + clean;
  return clean;
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const [loginType, setLoginType] = useState('phone');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getIdentifier = () => {
    if (loginType === 'phone') return normalizePhone(identifier);
    return identifier.toLowerCase().trim();
  };

  const handleLogin = async () => {
    if (!identifier.trim() || !password) { setError('সব তথ্য পূরণ করুন'); return; }

    // Phone format validate
    if (loginType === 'phone') {
      const clean = identifier.replace(/[\s\-()+]/g, '');
      if (!/^(8801|01|1)[3-9]\d{8}$/.test(clean)) {
        setError('সঠিক বাংলাদেশী ফোন নম্বর দিন (01XXXXXXXXX)');
        return;
      }
    }

    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: getIdentifier(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'লগইন ব্যর্থ হয়েছে'); return; }

      setAuth(data.user, data.shop, data.token);
      document.cookie = `digiboi_token=${data.token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;

      // Role অনুযায়ী redirect
      if (data.user?.role === 'super_admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch { setError('সার্ভারে সমস্যা হয়েছে'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0F4C81 0%,#2E86DE 55%,#60A5FA 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Hind Siliguri',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ width: '80px', height: '80px', background: 'white', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <span style={{ fontWeight: '800', fontSize: '38px', color: '#0F4C81', fontFamily: "'Syne',sans-serif" }}>D</span>
        </div>
        <h1 style={{ color: 'white', fontSize: '30px', fontWeight: '800', margin: 0, fontFamily: "'Syne',sans-serif" }}>Digiboi</h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', marginTop: '5px' }}>আপনার ব্যবসার ডিজিটাল সহকারী 🇧🇩</p>
      </div>

      <div style={{ background: 'white', borderRadius: '28px', padding: '28px 24px', width: '100%', maxWidth: '400px', boxShadow: '0 24px 60px rgba(0,0,0,0.22)' }}>

        {/* Tab */}
        <div style={{ display: 'flex', background: '#F0F4F8', borderRadius: '14px', padding: '5px', marginBottom: '22px' }}>
          {[['phone', '📱 ফোন'], ['email', '✉️ ইমেইল']].map(([k, l]) => (
            <button key={k} onClick={() => { setLoginType(k); setIdentifier(''); setError(''); }}
              style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', background: loginType === k ? 'white' : 'transparent', color: loginType === k ? '#0F4C81' : '#5E6E8A', boxShadow: loginType === k ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', fontFamily: 'inherit' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Identifier input */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#5E6E8A', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {loginType === 'phone' ? 'ফোন নম্বর' : 'ইমেইল'} <span style={{ color: '#E63946' }}>*</span>
          </label>
          {loginType === 'phone' ? (
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#5E6E8A', fontWeight: '600', pointerEvents: 'none', zIndex: 1 }}>🇧🇩 +88</span>
              <input
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="01XXXXXXXXX"
                type="tel"
                maxLength={14}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ width: '100%', padding: '13px 14px 13px 80px', border: '2px solid #E8EDF5', borderRadius: '12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>
          ) : (
            <input
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="email@example.com"
              type="email"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', padding: '13px 14px', border: '2px solid #E8EDF5', borderRadius: '12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          )}
        </div>

        {/* Password */}
        <div style={{ marginBottom: '6px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#5E6E8A', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            পাসওয়ার্ড <span style={{ color: '#E63946' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="আপনার পাসওয়ার্ড"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', padding: '13px 44px 13px 14px', border: '2px solid #E8EDF5', borderRadius: '12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            <button onClick={() => setShowPass(!showPass)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <Link href="/auth/forgot-password" style={{ display: 'block', textAlign: 'right', fontSize: '13px', color: '#2E86DE', fontWeight: '600', textDecoration: 'none', marginBottom: '20px' }}>
          পাসওয়ার্ড ভুলে গেছেন?
        </Link>

        {error && (
          <div style={{ background: '#FDECEA', border: '1px solid #E63946', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#E63946', fontWeight: '600' }}>
            ⚠️ {error}
          </div>
        )}

        <button onClick={handleLogin} disabled={loading}
          style={{ width: '100%', padding: '15px', background: 'linear-gradient(135deg,#0F4C81,#2E86DE)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading ? 0.8 : 1 }}>
          {loading
            ? <><span style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />লগইন হচ্ছে...</>
            : 'লগইন করুন →'
          }
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '18px 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#DDE4EE' }} />
          <span style={{ fontSize: '12px', color: '#8A9AB5' }}>অথবা</span>
          <div style={{ flex: 1, height: '1px', background: '#DDE4EE' }} />
        </div>

        <Link href="/auth/register">
          <button style={{ width: '100%', padding: '14px', border: '2px solid #DDE4EE', borderRadius: '14px', background: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#0F4C81', fontFamily: 'inherit' }}>
            নতুন অ্যাকাউন্ট তৈরি করুন
          </button>
        </Link>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', marginTop: '20px' }}>
        © 2025 Digiboi — শুধুমাত্র বাংলাদেশের জন্য 🇧🇩
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
