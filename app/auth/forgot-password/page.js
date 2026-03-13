'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1=phone, 2=otp+newpass, 3=done
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [otpReceived, setOtpReceived] = useState(''); // dev mode
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalizePhone = (p) => {
    const clean = p.replace(/\s|-/g, '');
    if (clean.startsWith('+880')) return clean;
    if (clean.startsWith('880')) return '+' + clean;
    if (clean.startsWith('0')) return '+88' + clean;
    return '+88' + clean;
  };

  const requestOTP = async () => {
    if (!phone.trim()) { setError('ফোন নম্বর দিন'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizePhone(phone) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'সমস্যা হয়েছে'); return; }
      if (data.otp) setOtpReceived(data.otp); // dev mode: show OTP in UI
      setStep(2);
    } catch { setError('সার্ভারে সমস্যা হয়েছে'); }
    finally { setLoading(false); }
  };

  const resetPass = async () => {
    if (!otp.trim()) { setError('OTP কোড দিন'); return; }
    if (otp.length !== 6) { setError('৬ সংখ্যার OTP দিন'); return; }
    if (!newPass) { setError('নতুন পাসওয়ার্ড দিন'); return; }
    if (newPass.length < 8) { setError('পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে'); return; }
    if (newPass !== confirmPass) { setError('পাসওয়ার্ড দুটো মিলছে না'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizePhone(phone), otp, newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'সমস্যা হয়েছে'); return; }
      setStep(3);
    } catch { setError('সার্ভারে সমস্যা হয়েছে'); }
    finally { setLoading(false); }
  };

  const inp = { width: '100%', padding: '13px 14px', border: '2px solid #E8EDF5', borderRadius: '12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: "'Hind Siliguri',sans-serif" };
  const lbl = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#5E6E8A', marginBottom: '6px' };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0F4C81 0%,#2E86DE 55%,#60A5FA 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Hind Siliguri',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet" />

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ width: '70px', height: '70px', background: 'white', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 8px 28px rgba(0,0,0,0.18)', fontSize: '32px' }}>
          {step === 3 ? '✅' : '🔑'}
        </div>
        <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '800', margin: 0 }}>
          {step === 1 ? 'পাসওয়ার্ড রিসেট' : step === 2 ? 'OTP যাচাই' : 'সফল হয়েছে!'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', marginTop: '6px' }}>
          {step === 1 ? 'নিবন্ধিত ফোন নম্বর দিন' : step === 2 ? `${phone} নম্বরে OTP পাঠানো হয়েছে` : 'পাসওয়ার্ড পরিবর্তন সম্পন্ন!'}
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>

        {error && <div style={{ background: '#FDECEA', border: '1px solid #E63946', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: '#E63946', fontWeight: '600' }}>⚠️ {error}</div>}

        {step === 1 && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={lbl}>ফোন নম্বর <span style={{ color: '#E63946' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#5E6E8A', fontWeight: '600', pointerEvents: 'none' }}>🇧🇩 +88</span>
                <input style={{ ...inp, paddingLeft: '80px' }} placeholder="01XXXXXXXXX" value={phone}
                  onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && requestOTP()} type="tel" maxLength={11} />
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#8A9AB5' }}>রেজিস্ট্রেশনে ব্যবহৃত ফোন নম্বর</p>
            </div>
            <button onClick={requestOTP} disabled={loading}
              style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#0F4C81,#2E86DE)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
              {loading ? '⏳ পাঠানো হচ্ছে...' : '📨 OTP পাঠান'}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            {/* Dev mode OTP display */}
            {otpReceived && (
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#065F46', fontWeight: '600' }}>✅ OTP পাঠানো হয়েছে</p>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0F4C81', letterSpacing: '6px', fontFamily: 'monospace' }}>{otpReceived}</p>
                <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#6B7280' }}>⚠️ SMS সার্ভিস সংযুক্ত হলে SMS-এ পাবেন</p>
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>৬ সংখ্যার OTP <span style={{ color: '#E63946' }}>*</span></label>
              <input style={{ ...inp, textAlign: 'center', letterSpacing: '8px', fontSize: '22px', fontWeight: '800' }}
                placeholder="• • • • • •" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} type="tel" />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>নতুন পাসওয়ার্ড <span style={{ color: '#E63946' }}>*</span></label>
              <input style={inp} type="password" placeholder="কমপক্ষে ৮ অক্ষর" value={newPass} onChange={e => setNewPass(e.target.value)} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={lbl}>পাসওয়ার্ড নিশ্চিত করুন</label>
              <input style={inp} type="password" placeholder="আবার টাইপ করুন" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
            </div>
            <button onClick={resetPass} disabled={loading}
              style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#0BAA69,#059669)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '10px' }}>
              {loading ? '⏳ পরিবর্তন হচ্ছে...' : '✓ পাসওয়ার্ড পরিবর্তন করুন'}
            </button>
            <button onClick={requestOTP} disabled={loading}
              style={{ width: '100%', padding: '10px', background: 'none', border: '2px solid #DDE4EE', borderRadius: '12px', fontSize: '13px', color: '#0F4C81', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>
              🔄 নতুন OTP পাঠান
            </button>
          </>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
            <p style={{ fontSize: '14px', color: '#5E6E8A', marginBottom: '24px' }}>পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে। এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।</p>
            <button onClick={() => router.push('/auth/login')}
              style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#0F4C81,#2E86DE)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
              লগইন করুন →
            </button>
          </div>
        )}

        {step !== 3 && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Link href="/auth/login" style={{ fontSize: '13px', color: '#8A9AB5', textDecoration: 'none' }}>← লগইনে ফিরুন</Link>
          </div>
        )}
      </div>
    </div>
  );
}
