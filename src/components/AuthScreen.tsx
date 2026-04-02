'use client'
import { useState } from 'react'
import { useAuth, type RegisterData } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'
import { Eye, EyeOff, Phone, Lock, Store, User, MapPin, ChevronRight, ChevronLeft, Check, Sparkles, ShieldCheck } from 'lucide-react'

const CC    = [{ v:'+880',l:'🇧🇩 +880' },{ v:'+91',l:'🇮🇳 +91' },{ v:'+1',l:'🇺🇸 +1' },{ v:'+44',l:'🇬🇧 +44' },{ v:'+971',l:'🇦🇪 +971' }]
const CLIST = ['Bangladesh','India','United States','United Kingdom','UAE','Saudi Arabia','Malaysia','Singapore','Australia']
const BLIST = ['Retail Shop','Wholesale','Online Shop','Restaurant','Pharmacy','Grocery','Electronics','Clothing','Hardware','Other']
const STEPS = ['ব্যবসার তথ্য','মালিকের তথ্য','অ্যাকাউন্ট']

export default function AuthScreen() {
  const [tab,  setTab]  = useState<'login'|'register'>('login')
  const [lCc,  setLCc]  = useState('+880'), [lPh, setLPh] = useState(''), [lPw, setLPw] = useState('')
  const [lErr, setLErr] = useState(''), [lLd, setLLd] = useState(false), [eye, setEye] = useState(false)
  const [step, setStep] = useState(0), [rErr, setRErr] = useState(''), [rLd, setRLd] = useState(false)
  const [reg,  setReg]  = useState<Partial<RegisterData>>({})
  const [rCc,  setRCc]  = useState('+880'), [rPh, setRPh] = useState(''), [cPw, setCPw] = useState(''), [ok, setOk] = useState(false)
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
      if (!reg.country)  return setRErr('দেশ নির্বাচন করুন')
      if (!reg.city)     return setRErr('শহরের নাম দিন')
      if (!reg.address)  return setRErr('ঠিকানা দিন')
      if (!reg.shopPhone) return setRErr('ব্যবসার ফোন নম্বর দিন')
    }
    if (step === 1) {
      if (!reg.ownerName)  return setRErr('মালিকের নাম দিন')
      if (!reg.ownerPhone) return setRErr('ব্যক্তিগত ফোন নম্বর দিন')
      if (!reg.nid)        return setRErr('জাতীয় পরিচয়পত্র নম্বর দিন')
      if (!reg.dob)        return setRErr('জন্ম তারিখ দিন')
    }
    setStep(s => s + 1)
  }

  async function doReg(e: React.FormEvent) {
    e.preventDefault(); setRErr('')
    if (!rPh)                                 return setRErr('লগইন ফোন নম্বর দিন')
    if (!reg.password || reg.password.length < 8) return setRErr('পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে')
    if (reg.password !== cPw)                 return setRErr('পাসওয়ার্ড মিলছে না')
    if (!ok)                                  return setRErr('শর্তাবলীতে সম্মতি দিন')
    setRLd(true); const r = await register({ ...(reg as RegisterData), loginPhone: rCc + rPh }); setRLd(false)
    if (r.error) return setRErr(r.error)
    toast('অ্যাকাউন্ট তৈরি হয়েছে! স্বাগতম ' + reg.shopName + ' 🎉', 'ok')
  }

  function sf(f: keyof RegisterData, v: string) { setReg(p => ({ ...p, [f]: v })) }

  return (
    <div className="auth-screen">
      {/* ── Hero ── */}
      <div className="auth-hero">
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:22 }}>
            <div style={{ width:56, height:56, background:'rgba(255,255,255,0.18)', borderRadius:17, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(12px)', border:'1.5px solid rgba(255,255,255,0.28)', boxShadow:'0 4px 16px rgba(0,0,0,0.16)' }}>
              <Sparkles size={26} color="white" />
            </div>
            <div>
              <div style={{ fontSize:'1.5rem', fontWeight:900, color:'white', letterSpacing:'-0.03em', lineHeight:1 }}>Digiboi</div>
              <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.82)', fontFamily:'var(--font-bn)', marginTop:3, fontWeight:500 }}>আপনার ব্যবসার ডিজিটাল সহকারী</div>
            </div>
          </div>
          <div style={{ color:'rgba(255,255,255,0.88)', fontSize:'0.88rem', fontFamily:'var(--font-bn)', lineHeight:1.65, maxWidth:340 }}>
            {tab === 'login'
              ? 'আপনার অ্যাকাউন্টে প্রবেশ করুন এবং আপনার ব্যবসা পরিচালনা করুন।'
              : 'মাত্র কয়েক মিনিটে আপনার ব্যবসা ডিজিটাল করুন।'}
          </div>
          {/* trust badges */}
          <div style={{ display:'flex', gap:10, marginTop:16, flexWrap:'wrap' }}>
            {['🔒 নিরাপদ','⚡ দ্রুত','📊 স্মার্ট'].map(b => (
              <div key={b} style={{ background:'rgba(255,255,255,0.14)', borderRadius:20, padding:'4px 10px', fontSize:'0.68rem', color:'rgba(255,255,255,0.9)', fontFamily:'var(--font-bn)', fontWeight:600, backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.2)' }}>{b}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="auth-body">
        <div className="auth-tabs">
          <button className={`auth-tab ${tab==='login' ? 'active' : ''}`} onClick={() => { setTab('login'); setStep(0); setLErr('') }}>লগইন</button>
          <button className={`auth-tab ${tab==='register' ? 'active' : ''}`} onClick={() => { setTab('register'); setStep(0); setRErr('') }}>নিবন্ধন</button>
        </div>

        {/* ── LOGIN ── */}
        {tab === 'login' && (
          <form onSubmit={doLogin} style={{ display:'flex', flexDirection:'column', gap:0 }}>
            <div className="input-group">
              <label className="input-label"><Phone size={12} style={{ verticalAlign:'middle', marginRight:4 }} />ফোন নম্বর</label>
              <div style={{ display:'flex', gap:8 }}>
                <select className="input" style={{ width:110, flexShrink:0 }} value={lCc} onChange={e => setLCc(e.target.value)}>
                  {CC.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                </select>
                <input className="input" style={{ flex:1 }} type="tel" inputMode="numeric" placeholder="01XXXXXXXXX" value={lPh} onChange={e => setLPh(e.target.value)} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label"><Lock size={12} style={{ verticalAlign:'middle', marginRight:4 }} />পাসওয়ার্ড</label>
              <div style={{ position:'relative' }}>
                <input className="input" type={eye?'text':'password'} placeholder="পাসওয়ার্ড দিন" style={{ paddingRight:44 }} value={lPw} onChange={e => setLPw(e.target.value)} />
                <button type="button" onClick={() => setEye(v => !v)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text3)', cursor:'pointer', display:'flex', alignItems:'center' }}>
                  {eye ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {lErr && <div className="err-text" style={{ marginBottom:12 }}>⚠ {lErr}</div>}
            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop:4 }} disabled={lLd}>
              {lLd ? <span className="spin" style={{ display:'inline-block', width:16, height:16, border:'2.5px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%' }} /> : '→ লগইন করুন'}
            </button>
          </form>
        )}

        {/* ── REGISTER ── */}
        {tab === 'register' && (
          <>
            {/* Step indicator */}
            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                {STEPS.map((s, i) => (
                  <span key={i} style={{ fontSize:'0.68rem', fontFamily:'var(--font-bn)', color: i <= step ? 'var(--br1)' : 'var(--text4)', fontWeight: i === step ? 700 : 500 }}>{s}</span>
                ))}
              </div>
              <div className="steps">
                {STEPS.map((_, i) => <div key={i} className={`step-dot ${i < step ? 'done' : i === step ? 'active' : ''}`} />)}
              </div>
            </div>

            {step === 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                <div className="input-group">
                  <label className="input-label"><Store size={12} style={{ verticalAlign:'middle', marginRight:4 }} />ব্যবসার নাম</label>
                  <input className="input" placeholder="আপনার দোকানের নাম" value={reg.shopName||''} onChange={e => sf('shopName',e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">ব্যবসার ধরন</label>
                  <select className="input" value={reg.shopType||''} onChange={e => sf('shopType',e.target.value)}>
                    <option value="">নির্বাচন করুন</option>
                    {BLIST.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="grid-2">
                  <div className="input-group">
                    <label className="input-label">দেশ</label>
                    <select className="input" value={reg.country||''} onChange={e => sf('country',e.target.value)}>
                      <option value="">নির্বাচন করুন</option>
                      {CLIST.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">শহর</label>
                    <input className="input" placeholder="ঢাকা" value={reg.city||''} onChange={e => sf('city',e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label"><MapPin size={12} style={{ verticalAlign:'middle', marginRight:4 }} />ঠিকানা</label>
                  <input className="input" placeholder="সম্পূর্ণ ঠিকানা" value={reg.address||''} onChange={e => sf('address',e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">ব্যবসার ফোন</label>
                  <div style={{ display:'flex', gap:8 }}>
                    <select className="input" style={{ width:100, flexShrink:0 }} value={rCc} onChange={e => setRCc(e.target.value)}>
                      {CC.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                    </select>
                    <input className="input" style={{ flex:1 }} type="tel" placeholder="01XXXXXXXXX" value={reg.shopPhone||''} onChange={e => sf('shopPhone',e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                <div className="input-group">
                  <label className="input-label"><User size={12} style={{ verticalAlign:'middle', marginRight:4 }} />মালিকের নাম</label>
                  <input className="input" placeholder="আপনার পুরো নাম" value={reg.ownerName||''} onChange={e => sf('ownerName',e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">ব্যক্তিগত ফোন</label>
                  <div style={{ display:'flex', gap:8 }}>
                    <select className="input" style={{ width:100, flexShrink:0 }} value={rCc} onChange={e => setRCc(e.target.value)}>
                      {CC.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                    </select>
                    <input className="input" style={{ flex:1 }} type="tel" placeholder="01XXXXXXXXX" value={reg.ownerPhone||''} onChange={e => sf('ownerPhone',e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">জাতীয় পরিচয়পত্র নম্বর</label>
                  <input className="input" placeholder="NID নম্বর" value={reg.nid||''} onChange={e => sf('nid',e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">জন্ম তারিখ</label>
                  <input className="input" type="date" value={reg.dob||''} onChange={e => sf('dob',e.target.value)} />
                </div>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={doReg} style={{ display:'flex', flexDirection:'column', gap:0 }}>
                <div className="input-group">
                  <label className="input-label"><Phone size={12} style={{ verticalAlign:'middle', marginRight:4 }} />লগইন ফোন</label>
                  <div style={{ display:'flex', gap:8 }}>
                    <select className="input" style={{ width:100, flexShrink:0 }} value={rCc} onChange={e => setRCc(e.target.value)}>
                      {CC.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                    </select>
                    <input className="input" style={{ flex:1 }} type="tel" placeholder="01XXXXXXXXX" value={rPh} onChange={e => setRPh(e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label"><Lock size={12} style={{ verticalAlign:'middle', marginRight:4 }} />পাসওয়ার্ড</label>
                  <div style={{ position:'relative' }}>
                    <input className="input" type={eye?'text':'password'} placeholder="কমপক্ষে ৮ অক্ষর" style={{ paddingRight:44 }} value={reg.password||''} onChange={e => sf('password',e.target.value)} />
                    <button type="button" onClick={() => setEye(v=>!v)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text3)', cursor:'pointer', display:'flex' }}>
                      {eye ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">পাসওয়ার্ড নিশ্চিত করুন</label>
                  <input className="input" type="password" placeholder="পুনরায় পাসওয়ার্ড দিন" value={cPw} onChange={e => setCPw(e.target.value)} />
                </div>
                {/* Terms */}
                <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:16, padding:12, background:'var(--surface2)', borderRadius:10, border:'1px solid var(--border)' }}>
                  <button type="button" className={`toggle ${ok?'on':''}`} onClick={() => setOk(v=>!v)} style={{ flexShrink:0, marginTop:2 }} />
                  <span style={{ fontSize:'0.74rem', color:'var(--text2)', fontFamily:'var(--font-bn)', lineHeight:1.6 }}>আমি <span style={{ color:'var(--br1)', fontWeight:700 }}>শর্তাবলী</span> এবং <span style={{ color:'var(--br1)', fontWeight:700 }}>গোপনীয়তা নীতি</span>-তে সম্মত</span>
                </div>
                {rErr && <div className="err-text" style={{ marginBottom:12 }}>⚠ {rErr}</div>}
                <div style={{ display:'flex', gap:8 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(s=>s-1)}>
                    <ChevronLeft size={16} /> পেছনে
                  </button>
                  <button type="submit" className="btn btn-primary btn-full" disabled={rLd}>
                    {rLd ? <span className="spin" style={{ display:'inline-block', width:16, height:16, border:'2.5px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%' }} /> : <><Check size={16} /> নিবন্ধন করুন</>}
                  </button>
                </div>
              </form>
            )}

            {step < 2 && (
              <>
                {rErr && <div className="err-text" style={{ marginBottom:12 }}>⚠ {rErr}</div>}
                <div style={{ display:'flex', gap:8, marginTop:4 }}>
                  {step > 0 && <button className="btn btn-ghost" onClick={() => setStep(s=>s-1)}><ChevronLeft size={16} /> পেছনে</button>}
                  <button className="btn btn-primary btn-full" onClick={nxt}>
                    পরবর্তী <ChevronRight size={16} />
                  </button>
                </div>
              </>
            )}

            {/* Security note */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:16, padding:'10px 12px', background:'var(--success-l)', borderRadius:10, border:'1px solid rgba(0,214,143,0.15)' }}>
              <ShieldCheck size={15} color="var(--success)" style={{ flexShrink:0 }} />
              <span style={{ fontSize:'0.7rem', color:'var(--success)', fontFamily:'var(--font-bn)', fontWeight:600 }}>আপনার তথ্য সম্পূর্ণ নিরাপদ ও এনক্রিপ্টেড</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
