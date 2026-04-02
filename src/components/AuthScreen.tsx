'use client'
import { useState } from 'react'
import { useAuth, type RegisterData } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'
import { Eye, EyeOff, Phone, Lock, Store, User, MapPin, ChevronRight, ChevronLeft, Check } from 'lucide-react'

const CC = [{ v: '+880', l: '🇧🇩 +880' }, { v: '+91', l: '🇮🇳 +91' }, { v: '+1', l: '🇺🇸 +1' }, { v: '+44', l: '🇬🇧 +44' }, { v: '+971', l: '🇦🇪 +971' }]
const CLIST = ['Bangladesh', 'India', 'United States', 'United Kingdom', 'UAE', 'Saudi Arabia', 'Malaysia', 'Singapore', 'Australia']
const BLIST = ['Retail Shop', 'Wholesale', 'Online Shop', 'Restaurant', 'Pharmacy', 'Grocery', 'Electronics', 'Clothing', 'Hardware', 'Other']
const STEPS = ['ব্যবসার তথ্য', 'মালিকের তথ্য', 'অ্যাকাউন্ট']

export default function AuthScreen() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
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
    toast('স্বাগতম! 🎉', 'ok')
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
    toast('অ্যাকাউন্ট তৈরি হয়েছে! স্বাগতম ' + reg.shopName + ' 🎉', 'ok')
  }

  function sf(f: keyof RegisterData, v: string) { setReg(p => ({ ...p, [f]: v })) }

  return (
    <div className="auth-screen">
      {/* Hero */}
      <div className="auth-hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, background: 'rgba(255,255,255,0.2)', borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', backdropFilter: 'blur(10px)' }}>📦</div>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>Digiboi</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-bn)' }}>আপনার ব্যবসার ডিজিটাল সহকারী</div>
            </div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', fontFamily: 'var(--font-bn)', lineHeight: 1.6 }}>
            {tab === 'login' ? 'আপনার অ্যাকাউন্টে প্রবেশ করুন এবং আপনার ব্যবসা পরিচালনা করুন।' : 'মাত্র কয়েক মিনিটে আপনার ব্যবসা ডিজিটাল করুন।'}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="auth-body">
        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setStep(0); setLErr('') }}>
            লগইন
          </button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setStep(0); setRErr('') }}>
            নিবন্ধন
          </button>
        </div>

        {/* Login Form */}
        {tab === 'login' && (
          <form onSubmit={doLogin} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div className="input-group">
              <label className="input-label">ফোন নম্বর</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select className="input" style={{ width: 110, flexShrink: 0 }} value={lCc} onChange={e => setLCc(e.target.value)}>
                  {CC.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                </select>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                  <input className="input" style={{ paddingLeft: 36 }} type="tel" placeholder="01XXXXXXXXX" value={lPh} onChange={e => setLPh(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">পাসওয়ার্ড</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', zIndex: 1 }} />
                <input className="input" style={{ paddingLeft: 36, paddingRight: 44 }} type={eye ? 'text' : 'password'} placeholder="••••••••" value={lPw} onChange={e => setLPw(e.target.value)} />
                <button type="button" onClick={() => setEye(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>
                  {eye ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {lErr && <div className="err-text" style={{ marginBottom: 12 }}>⚠ {lErr}</div>}

            <button className="btn btn-primary btn-full" type="submit" disabled={lLd} style={{ padding: 14, marginTop: 4 }}>
              {lLd ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />
                  লগইন হচ্ছে...
                </span>
              ) : 'লগইন করুন'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>
              অ্যাকাউন্ট নেই?{' '}
              <button type="button" onClick={() => setTab('register')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-bn)' }}>
                নিবন্ধন করুন
              </button>
            </div>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <div>
            {/* Step Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              {STEPS.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: i < step ? 'var(--success)' : i === step ? 'var(--primary)' : 'var(--surface3)',
                    color: i <= step ? 'white' : 'var(--text3)', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0, transition: 'all 0.3s'
                  }}>
                    {i < step ? <Check size={14} /> : i + 1}
                  </div>
                  {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? 'var(--success)' : 'var(--border)', borderRadius: 1, transition: 'background 0.3s' }} />}
                </div>
              ))}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text2)', marginBottom: 16, fontFamily: 'var(--font-bn)' }}>{STEPS[step]}</div>

            {/* Step 0: Business Info */}
            {step === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div className="input-group">
                  <label className="input-label">ব্যবসার নাম *</label>
                  <div style={{ position: 'relative' }}>
                    <Store size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                    <input className="input" style={{ paddingLeft: 36 }} placeholder="যেমন: রহিম স্টোর" value={reg.shopName || ''} onChange={e => sf('shopName', e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">ব্যবসার ধরন *</label>
                  <select className="input" value={reg.shopType || ''} onChange={e => sf('shopType', e.target.value)}>
                    <option value="">নির্বাচন করুন...</option>
                    {BLIST.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="grid-2">
                  <div className="input-group">
                    <label className="input-label">দেশ *</label>
                    <select className="input" value={reg.country || ''} onChange={e => sf('country', e.target.value)}>
                      <option value="">নির্বাচন...</option>
                      {CLIST.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">শহর *</label>
                    <input className="input" placeholder="ঢাকা" value={reg.city || ''} onChange={e => sf('city', e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">ঠিকানা *</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={15} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text3)' }} />
                    <input className="input" style={{ paddingLeft: 36 }} placeholder="পূর্ণ ঠিকানা" value={reg.address || ''} onChange={e => sf('address', e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">ব্যবসার ফোন *</label>
                  <input className="input" type="tel" placeholder="01XXXXXXXXX" value={reg.shopPhone || ''} onChange={e => sf('shopPhone', e.target.value)} />
                </div>
              </div>
            )}

            {/* Step 1: Owner Info */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div className="input-group">
                  <label className="input-label">মালিকের পূর্ণ নাম *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                    <input className="input" style={{ paddingLeft: 36 }} placeholder="মোঃ রহিম উদ্দিন" value={reg.ownerName || ''} onChange={e => sf('ownerName', e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">ব্যক্তিগত ফোন *</label>
                  <input className="input" type="tel" placeholder="01XXXXXXXXX" value={reg.ownerPhone || ''} onChange={e => sf('ownerPhone', e.target.value)} />
                </div>
                <div className="grid-2">
                  <div className="input-group">
                    <label className="input-label">জাতীয় পরিচয়পত্র *</label>
                    <input className="input" placeholder="NID নম্বর" value={reg.nid || ''} onChange={e => sf('nid', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">জন্ম তারিখ *</label>
                    <input className="input" type="date" value={reg.dob || ''} onChange={e => sf('dob', e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">লিঙ্গ</label>
                  <select className="input" value={reg.gender || ''} onChange={e => sf('gender', e.target.value)}>
                    <option value="">নির্বাচন করুন...</option>
                    <option value="Male">পুরুষ</option>
                    <option value="Female">মহিলা</option>
                    <option value="Other">অন্যান্য</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Account Setup */}
            {step === 2 && (
              <form onSubmit={doReg} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ background: 'var(--primary-bg)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Store size={16} color="var(--primary)" />
                  <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-bn)', color: 'var(--text2)' }}>
                    <strong style={{ color: 'var(--primary)' }}>{reg.shopName}</strong> এর অ্যাকাউন্ট তৈরি হচ্ছে
                  </span>
                </div>
                <div className="input-group">
                  <label className="input-label">লগইন ফোন নম্বর *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select className="input" style={{ width: 110, flexShrink: 0 }} value={rCc} onChange={e => setRCc(e.target.value)}>
                      {CC.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                    </select>
                    <input className="input" style={{ flex: 1 }} type="tel" placeholder="01XXXXXXXXX" value={rPh} onChange={e => setRPh(e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">পাসওয়ার্ড * (কমপক্ষে ৮ অক্ষর)</label>
                  <input className="input" type="password" placeholder="••••••••" value={reg.password || ''} onChange={e => sf('password', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">পাসওয়ার্ড নিশ্চিত করুন *</label>
                  <input className="input" type="password" placeholder="••••••••" value={cPw} onChange={e => setCPw(e.target.value)} />
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.75rem', color: 'var(--text2)', cursor: 'pointer', lineHeight: 1.6, marginBottom: 14, fontFamily: 'var(--font-bn)' }}>
                  <input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} style={{ accentColor: 'var(--primary)', width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
                  <span>আমি <strong style={{ color: 'var(--primary)' }}>শর্তাবলী</strong> ও <strong style={{ color: 'var(--primary)' }}>গোপনীয়তা নীতি</strong>তে সম্মত</span>
                </label>
                {rErr && <div className="err-text" style={{ marginBottom: 12 }}>⚠ {rErr}</div>}
                <button className="btn btn-primary btn-full" type="submit" disabled={rLd} style={{ padding: 14 }}>
                  {rLd ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />
                      অ্যাকাউন্ট তৈরি হচ্ছে...
                    </span>
                  ) : <><Check size={16} /> নিবন্ধন সম্পন্ন করুন</>}
                </button>
              </form>
            )}

            {rErr && step < 2 && <div className="err-text" style={{ marginTop: 10 }}>⚠ {rErr}</div>}

            {step < 2 && (
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                {step > 0 && (
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setRErr(''); setStep(s => s - 1) }}>
                    <ChevronLeft size={16} /> পেছনে
                  </button>
                )}
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={nxt}>
                  পরের ধাপ <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.62rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>
          Digiboi POS v4.0 · নিরাপদ ক্লাউড ব্যবসা ব্যবস্থাপনা
        </div>
      </div>
    </div>
  )
}
