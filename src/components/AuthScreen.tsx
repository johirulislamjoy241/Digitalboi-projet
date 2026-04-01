'use client'
import { useState } from 'react'
import { useAuth, type RegisterData } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'
import { Eye, EyeOff, Phone, Lock, Store, User, MapPin, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react'

const CC = [{ v: '+880', l: '🇧🇩 +880' }, { v: '+91', l: '🇮🇳 +91' }, { v: '+1', l: '🇺🇸 +1' }, { v: '+44', l: '🇬🇧 +44' }, { v: '+971', l: '🇦🇪 +971' }]
const CLIST = ['Bangladesh','India','United States','United Kingdom','UAE','Saudi Arabia','Malaysia','Singapore','Australia']
const BLIST = ['Retail Shop','Wholesale','Online Shop','Restaurant','Pharmacy','Grocery','Electronics','Clothing','Hardware','Other']
const STEPS = ['ব্যবসার তথ্য','মালিকের তথ্য','অ্যাকাউন্ট']

export default function AuthScreen() {
  const [tab, setTab] = useState<'login'|'register'>('login')
  const [lCc, setLCc] = useState('+880'), [lPh, setLPh] = useState(''), [lPw, setLPw] = useState('')
  const [lErr, setLErr] = useState(''), [lLd, setLLd] = useState(false), [eye, setEye] = useState(false)
  const [step, setStep] = useState(0), [rErr, setRErr] = useState(''), [rLd, setRLd] = useState(false)
  const [reg, setReg] = useState<Partial<RegisterData>>({})
  const [rCc, setRCc] = useState('+880'), [rPh, setRPh] = useState(''), [cPw, setCPw] = useState(''), [ok, setOk] = useState(false)
  const { login, register } = useAuth()
  const { toast } = useToast()

  async function doLogin(e: React.FormEvent) {
    e.preventDefault(); setLErr('')
    if (!lPh) return setLErr('ফোন নম্বর দিন')
    if (!lPw) return setLErr('পাসওয়ার্ড দিন')
    setLLd(true); const r = await login(lCc + lPh, lPw); setLLd(false)
    if (r.error) return setLErr(r.error)
    toast('স্বাগতম! 🎉','ok')
  }

  function nxt() {
    setRErr('')
    if (step === 0) {
      if (!reg.shopName) return setRErr('ব্যবসার নাম দিন')
      if (!reg.shopType) return setRErr('ব্যবসার ধরন নির্বাচন করুন')
      if (!reg.country) return setRErr('দেশ নির্বাচন করুন')
      if (!reg.city) return setRErr('শহরের নাম দিন')
      if (!reg.address) return setRErr('ঠিকানা দিন')
      if (!reg.shopPhone) return setRErr('ব্যবসার ফোন নম্বর দিন')
    }
    if (step === 1) {
      if (!reg.ownerName) return setRErr('মালিকের নাম দিন')
      if (!reg.ownerPhone) return setRErr('ব্যক্তিগত ফোন নম্বর দিন')
      if (!reg.nid) return setRErr('জাতীয় পরিচয়পত্র নম্বর দিন')
      if (!reg.dob) return setRErr('জন্ম তারিখ দিন')
    }
    setStep(s => s + 1)
  }

  async function doReg(e: React.FormEvent) {
    e.preventDefault(); setRErr('')
    if (!rPh) return setRErr('লগইন ফোন নম্বর দিন')
    if (!reg.password || reg.password.length < 8) return setRErr('পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে')
    if (reg.password !== cPw) return setRErr('পাসওয়ার্ড মিলছে না')
    if (!ok) return setRErr('শর্তাবলীতে সম্মতি দিন')
    setRLd(true); const r = await register({ ...(reg as RegisterData), loginPhone: rCc + rPh }); setRLd(false)
    if (r.error) return setRErr(r.error)
    toast('অ্যাকাউন্ট তৈরি হয়েছে! স্বাগতম ' + reg.shopName + ' 🎉','ok')
  }

  function sf(f: keyof RegisterData, v: string) { setReg(p => ({ ...p, [f]: v })) }

  return (
    <div className="auth-screen">
      {/* ── Hero Panel ── */}
      <div className="auth-hero">
        <div className="auth-hero-dots" />
        <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            <div style={{
              width: 56, height: 56,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem',
              border: '1.5px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(12px)',
              flexShrink: 0,
            }}>📦</div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', letterSpacing: '-0.04em', lineHeight: 1.1 }}>Digiboi</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-bn)', marginTop: 3 }}>আপনার ব্যবসার ডিজিটাল সহকারী</div>
            </div>
          </div>

          {/* Tagline */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', fontWeight: 800, color: 'white', lineHeight: 1.25, letterSpacing: '-0.02em', marginBottom: 10 }}>
              {tab === 'login' ? 'আপনার ব্যবসায়ে ফিরে আসুন' : 'ডিজিটাল ব্যবসা শুরু করুন'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: '0.85rem', fontFamily: 'var(--font-bn)', lineHeight: 1.65 }}>
              {tab === 'login'
                ? 'ইনভেন্টরি, বিক্রয়, বকেয়া — সবকিছু এক জায়গায় সহজে পরিচালনা করুন।'
                : 'মাত্র কয়েক মিনিটে আপনার ব্যবসাকে ডিজিটাল প্ল্যাটফর্মে নিয়ে আসুন।'}
            </div>
          </div>

          {/* Feature chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['📦 ইনভেন্টরি','💳 POS বিক্রয়','📊 রিপোর্ট','📒 বকেয়া'].map(f => (
              <div key={f} style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.22)',
                borderRadius: 99,
                padding: '5px 12px',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.95)',
                fontFamily: 'var(--font-bn)',
              }}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body Panel ── */}
      <div className="auth-body">
        {/* Brand on mobile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }} className="auth-mobile-brand">
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,var(--primary),var(--primary-dark))', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', boxShadow: 'var(--shadow-primary)' }}>📦</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>Digiboi</div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            {tab === 'login' ? 'লগইন করুন' : 'নিবন্ধন করুন'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>
            {tab === 'login' ? 'আপনার অ্যাকাউন্টে প্রবেশ করুন' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}
          </div>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setStep(0); setLErr('') }}>লগইন</button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setStep(0); setRErr('') }}>নিবন্ধন</button>
        </div>

        {/* ── Login Form ── */}
        {tab === 'login' && (
          <form onSubmit={doLogin} style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="input-group">
              <label className="input-label">ফোন নম্বর</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select className="input" style={{ width: 110, flexShrink: 0 }} value={lCc} onChange={e => setLCc(e.target.value)}>
                  {CC.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                </select>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Phone size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)' }} />
                  <input className="input" style={{ paddingLeft: 36 }} type="tel" placeholder="01XXXXXXXXX" value={lPh} onChange={e => setLPh(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">পাসওয়ার্ড</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)', zIndex: 1 }} />
                <input className="input" style={{ paddingLeft: 36, paddingRight: 44 }} type={eye ? 'text' : 'password'} placeholder="••••••••" value={lPw} onChange={e => setLPw(e.target.value)} />
                <button type="button" onClick={() => setEye(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  {eye ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {lErr && <div className="err-text" style={{ marginBottom: 14 }}>⚠ {lErr}</div>}

            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={lLd} style={{ marginTop: 4 }}>
              {lLd ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white' }} />
                  লগইন হচ্ছে...
                </span>
              ) : 'লগইন করুন'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>
              অ্যাকাউন্ট নেই?{' '}
              <button type="button" onClick={() => setTab('register')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-bn)' }}>
                নিবন্ধন করুন
              </button>
            </div>
          </form>
        )}

        {/* ── Register Form ── */}
        {tab === 'register' && (
          <div>
            {/* Step Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 22 }}>
              {STEPS.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: i < step ? 'var(--success)' : i === step ? 'var(--primary)' : 'var(--surface3)',
                      color: i <= step ? 'white' : 'var(--text4)',
                      fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
                      transition: 'all 0.3s ease',
                      border: i === step ? '2px solid var(--primary-dark)' : '2px solid transparent',
                    }}>
                      {i < step ? <Check size={13} /> : i + 1}
                    </div>
                    <div style={{ fontSize: '0.58rem', color: i <= step ? 'var(--text2)' : 'var(--text4)', fontFamily: 'var(--font-bn)', fontWeight: 600, whiteSpace: 'nowrap' }}>{s}</div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: i < step ? 'var(--success)' : 'var(--surface3)', margin: '0 4px', marginBottom: 20, borderRadius: 99, transition: 'background 0.3s ease' }} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 0 */}
            {step === 0 && (
              <div>
                <div className="input-group">
                  <label className="input-label">ব্যবসার নাম *</label>
                  <div style={{ position: 'relative' }}>
                    <Store size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)' }} />
                    <input className="input" style={{ paddingLeft: 36 }} type="text" placeholder="আপনার দোকানের নাম" value={reg.shopName || ''} onChange={e => sf('shopName', e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">ব্যবসার ধরন *</label>
                  <select className="input" value={reg.shopType || ''} onChange={e => sf('shopType', e.target.value)}>
                    <option value="">নির্বাচন করুন</option>
                    {BLIST.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">দেশ *</label>
                    <select className="input" value={reg.country || ''} onChange={e => sf('country', e.target.value)}>
                      <option value="">দেশ</option>
                      {CLIST.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">শহর *</label>
                    <input className="input" type="text" placeholder="শহর" value={reg.city || ''} onChange={e => sf('city', e.target.value)} />
                  </div>
                </div>
                <div className="input-group" style={{ marginTop: 14 }}>
                  <label className="input-label">পূর্ণ ঠিকানা *</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={14} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text4)' }} />
                    <textarea className="input" style={{ paddingLeft: 36, minHeight: 68 }} placeholder="সম্পূর্ণ ঠিকানা" value={reg.address || ''} onChange={e => sf('address', e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">ব্যবসার ফোন *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select className="input" style={{ width: 110, flexShrink: 0 }}>
                      {CC.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                    </select>
                    <input className="input" type="tel" placeholder="01XXXXXXXXX" value={reg.shopPhone || ''} onChange={e => sf('shopPhone', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1 */}
            {step === 1 && (
              <div>
                <div className="input-group">
                  <label className="input-label">মালিকের নাম *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)' }} />
                    <input className="input" style={{ paddingLeft: 36 }} type="text" placeholder="পূর্ণ নাম" value={reg.ownerName || ''} onChange={e => sf('ownerName', e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">ব্যক্তিগত ফোন *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select className="input" style={{ width: 110, flexShrink: 0 }}>
                      {CC.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                    </select>
                    <input className="input" type="tel" placeholder="01XXXXXXXXX" value={reg.ownerPhone || ''} onChange={e => sf('ownerPhone', e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">জাতীয় পরিচয়পত্র নম্বর *</label>
                  <input className="input" type="text" placeholder="NID নম্বর" value={reg.nid || ''} onChange={e => sf('nid', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">জন্ম তারিখ *</label>
                  <input className="input" type="date" value={reg.dob || ''} onChange={e => sf('dob', e.target.value)} />
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <form onSubmit={doReg}>
                <div className="input-group">
                  <label className="input-label">লগইন ফোন নম্বর *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select className="input" style={{ width: 110, flexShrink: 0 }} value={rCc} onChange={e => setRCc(e.target.value)}>
                      {CC.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                    </select>
                    <input className="input" type="tel" placeholder="01XXXXXXXXX" value={rPh} onChange={e => setRPh(e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর) *</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)', zIndex: 1 }} />
                    <input className="input" style={{ paddingLeft: 36 }} type="password" placeholder="••••••••" value={reg.password || ''} onChange={e => sf('password', e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">পাসওয়ার্ড নিশ্চিত করুন *</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)', zIndex: 1 }} />
                    <input className="input" style={{ paddingLeft: 36 }} type="password" placeholder="••••••••" value={cPw} onChange={e => setCPw(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
                  <button type="button" onClick={() => setOk(v => !v)} style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                    background: ok ? 'var(--primary)' : 'transparent',
                    border: `2px solid ${ok ? 'var(--primary)' : 'var(--border-strong)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                  }}>
                    {ok && <Check size={12} color="white" />}
                  </button>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)', lineHeight: 1.5 }}>
                    আমি Digiboi-এর <span style={{ color: 'var(--primary)', fontWeight: 600 }}>শর্তাবলী</span> ও <span style={{ color: 'var(--primary)', fontWeight: 600 }}>গোপনীয়তা নীতি</span>-তে সম্মত
                  </div>
                </div>
                {rErr && <div className="err-text" style={{ marginBottom: 14 }}>⚠ {rErr}</div>}
                <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={rLd}>
                  {rLd ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white' }} />
                      তৈরি হচ্ছে...
                    </span>
                  ) : <><Sparkles size={15} /> অ্যাকাউন্ট তৈরি করুন</>}
                </button>
              </form>
            )}

            {rErr && step < 2 && <div className="err-text" style={{ marginTop: 12 }}>⚠ {rErr}</div>}

            {step < 2 && (
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                {step > 0 && (
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setStep(s => s - 1); setRErr('') }}>
                    <ChevronLeft size={16} /> পূর্ববর্তী
                  </button>
                )}
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={nxt}>
                  পরবর্তী <ChevronRight size={16} />
                </button>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>
              অ্যাকাউন্ট আছে?{' '}
              <button type="button" onClick={() => { setTab('login'); setStep(0); setRErr('') }} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-bn)' }}>
                লগইন করুন
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
