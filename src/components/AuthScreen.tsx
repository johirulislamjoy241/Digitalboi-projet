'use client'
import { useState } from 'react'
import { useAuth, type RegisterData } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'
import { useAppStore } from '@/lib/app-store'
import { t } from '@/lib/i18n'

const CC=[{v:'+880',l:'🇧🇩 +880'},{v:'+91',l:'🇮🇳 +91'},{v:'+1',l:'🇺🇸 +1'},{v:'+44',l:'🇬🇧 +44'},{v:'+971',l:'🇦🇪 +971'}]
const CLIST=['Bangladesh','India','United States','United Kingdom','UAE','Saudi Arabia','Malaysia','Singapore','Australia']
const BLIST=['Retail Shop','Wholesale','Online Shop','Restaurant','Pharmacy','Grocery','Electronics','Clothing','Hardware','Other']

export default function AuthScreen(){
  const {lang}=useAppStore()
  const [tab,setTab]=useState<'login'|'register'>('login')
  const [lCc,setLCc]=useState('+880'),[lPh,setLPh]=useState(''),[lPw,setLPw]=useState('')
  const [lErr,setLErr]=useState(''),[lLd,setLLd]=useState(false),[eye,setEye]=useState(false)
  const [step,setStep]=useState(0),[rErr,setRErr]=useState(''),[rLd,setRLd]=useState(false)
  const [reg,setReg]=useState<Partial<RegisterData>>({})
  const [rCc,setRCc]=useState('+880'),[rPh,setRPh]=useState(''),[cPw,setCPw]=useState(''),[ok,setOk]=useState(false)
  const {login,register}=useAuth()
  const {toast}=useToast()

  async function doLogin(e:React.FormEvent){
    e.preventDefault();setLErr('')
    if(!lPh)return setLErr(lang==='bn'?'ফোন নম্বর দিন।':'Phone number is required.')
    if(!lPw)return setLErr(lang==='bn'?'পাসওয়ার্ড দিন।':'Password is required.')
    setLLd(true);const r=await login(lCc+lPh,lPw);setLLd(false)
    if(r.error)return setLErr(r.error)
    toast(t(lang,'welcome'),'ok')
  }

  function nxt(){
    setRErr('')
    if(step===0){
      if(!reg.shopName)return setRErr(lang==='bn'?'ব্যবসার নাম দিন।':'Business name is required.')
      if(!reg.shopType)return setRErr(lang==='bn'?'ব্যবসার ধরন বেছে নিন।':'Select business type.')
      if(!reg.country)return setRErr(lang==='bn'?'দেশ বেছে নিন।':'Select country.')
      if(!reg.city)return setRErr(lang==='bn'?'শহর/জেলা দিন।':'City is required.')
      if(!reg.address)return setRErr(lang==='bn'?'ঠিকানা দিন।':'Address is required.')
      if(!reg.shopPhone)return setRErr(lang==='bn'?'ব্যবসার ফোন দিন।':'Business phone is required.')
    }
    if(step===1){
      if(!reg.ownerName)return setRErr(lang==='bn'?'মালিকের নাম দিন।':'Owner name is required.')
      if(!reg.ownerPhone)return setRErr(lang==='bn'?'ব্যক্তিগত ফোন দিন।':'Personal phone is required.')
      if(!reg.nid)return setRErr(lang==='bn'?'জাতীয় পরিচয়পত্র দিন।':'National ID is required.')
      if(!reg.dob)return setRErr(lang==='bn'?'জন্ম তারিখ দিন।':'Date of birth is required.')
    }
    setStep(s=>s+1)
  }

  async function doReg(e:React.FormEvent){
    e.preventDefault();setRErr('')
    if(!rPh)return setRErr(lang==='bn'?'লগইন ফোন নম্বর দিন।':'Login phone is required.')
    if(!reg.password||reg.password.length<8)return setRErr(lang==='bn'?'পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে।':'Password must be at least 8 characters.')
    if(reg.password!==cPw)return setRErr(lang==='bn'?'পাসওয়ার্ড দুটি মিলছে না।':'Passwords do not match.')
    if(!ok)return setRErr(lang==='bn'?'শর্তাবলীতে সম্মত হন।':'Please agree to the Terms of Service.')
    setRLd(true);const r=await register({...(reg as RegisterData),loginPhone:rCc+rPh});setRLd(false)
    if(r.error)return setRErr(r.error)
    toast(t(lang,'welcomeNew')+', '+reg.shopName+'! 🎉','ok')
  }

  function sf(f:keyof RegisterData,v:string){setReg(p=>({...p,[f]:v}))}

  const STEP_LABELS=[t(lang,'businessInfo'),t(lang,'ownerInfo'),t(lang,'accountSetup')]

  return(
    <div className="auth-sc">
      <div className="auth-bg-circle1"/>
      <div className="auth-bg-circle2"/>
      <div className="auth-w">
        <div className="auth-logo">
          <div className="auth-ico">📦</div>
          <div className="auth-title">{t(lang,'appName')}</div>
          <div className="auth-sub">{t(lang,'appSub')}</div>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button className={'auth-tab '+(tab==='login'?'on':'')} onClick={()=>{setTab('login');setStep(0);setLErr('')}}>
              <i className="fas fa-sign-in-alt"/> {t(lang,'signIn')}
            </button>
            <button className={'auth-tab '+(tab==='register'?'on':'')} onClick={()=>{setTab('register');setStep(0);setRErr('')}}>
              <i className="fas fa-user-plus"/> {t(lang,'register')}
            </button>
          </div>

          {tab==='login'&&(
            <form onSubmit={doLogin} style={{display:'flex',flexDirection:'column',gap:14}}>
              <div className="fg">
                <label className="fl">{t(lang,'phone')}</label>
                <div style={{display:'flex',gap:8}}>
                  <select className="field" style={{width:'min(110px,32%)',flexShrink:0}} value={lCc} onChange={e=>setLCc(e.target.value)}>
                    {CC.map(c=><option key={c.v} value={c.v}>{c.l}</option>)}
                  </select>
                  <input className="field" type="tel" placeholder="01XXXXXXXXX" value={lPh} onChange={e=>setLPh(e.target.value)} autoComplete="tel" style={{flex:1,minWidth:0}}/>
                </div>
              </div>
              <div className="fg">
                <label className="fl">{t(lang,'password')}</label>
                <div style={{position:'relative'}}>
                  <input className="field" type={eye?'text':'password'} placeholder="••••••••" style={{paddingRight:42}} value={lPw} onChange={e=>setLPw(e.target.value)} autoComplete="current-password"/>
                  <button type="button" onClick={()=>setEye(v=>!v)} style={{position:'absolute',right:11,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:3,fontSize:'.85rem'}}>
                    <i className={'fas fa-eye'+(eye?'-slash':'')}/>
                  </button>
                </div>
              </div>
              {lErr&&<div className="eb"><i className="fas fa-exclamation-circle" style={{flexShrink:0}}/>{lErr}</div>}
              <button className="btn btn-p btn-full" type="submit" disabled={lLd} style={{padding:'12px',fontSize:'.87rem',marginTop:2}}>
                {lLd?<><span className="spin"/> {t(lang,'signingIn')}</>:<><i className="fas fa-unlock-alt"/> {t(lang,'signInBtn')}</>}
              </button>
              <div style={{textAlign:'center',fontSize:'.73rem',color:'var(--t3)'}}>
                {t(lang,'noAccount')}{' '}
                <button type="button" onClick={()=>setTab('register')} style={{background:'none',border:'none',color:'var(--p)',fontWeight:800,cursor:'pointer',fontSize:'inherit'}}>
                  {t(lang,'registerNow')} →
                </button>
              </div>
            </form>
          )}

          {tab==='register'&&(
            <div>
              <div className="step-bar">
                {STEP_LABELS.map((_,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center'}}>
                    <div className={'step-d '+(i<step?'done':i===step?'cur':'')} title={STEP_LABELS[i]}>
                      {i<step?<i className="fas fa-check" style={{fontSize:'.6rem'}}/>:i+1}
                    </div>
                    {i<2&&<div className={'step-l '+(i<step?'done':'')}/>}
                  </div>
                ))}
              </div>
              <div style={{fontSize:'.69rem',color:'var(--t3)',textAlign:'center',marginBottom:16,fontWeight:700}}>
                {t(lang,'step')} {step+1} {t(lang,'of')} 3 — {STEP_LABELS[step]}
              </div>

              {step===0&&(
                <div style={{display:'flex',flexDirection:'column',gap:11}}>
                  <div className="fg"><label className="fl">{t(lang,'businessName')} *</label><input className="field" placeholder="My Shop" value={reg.shopName||''} onChange={e=>sf('shopName',e.target.value)}/></div>
                  <div className="g2">
                    <div className="fg"><label className="fl">{t(lang,'businessType')} *</label>
                      <select className="field" value={reg.shopType||''} onChange={e=>sf('shopType',e.target.value)}>
                        <option value="">{t(lang,'select')}</option>
                        {BLIST.map(b=><option key={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="fg"><label className="fl">{t(lang,'country')} *</label>
                      <select className="field" value={reg.country||''} onChange={e=>sf('country',e.target.value)}>
                        <option value="">{t(lang,'select')}</option>
                        {CLIST.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="g2">
                    <div className="fg"><label className="fl">{t(lang,'division')}</label><input className="field" placeholder="Dhaka Division" value={reg.stateDiv||''} onChange={e=>sf('stateDiv',e.target.value)}/></div>
                    <div className="fg"><label className="fl">{t(lang,'city')} *</label><input className="field" placeholder="Gazipur" value={reg.city||''} onChange={e=>sf('city',e.target.value)}/></div>
                  </div>
                  <div className="fg"><label className="fl">{t(lang,'address')} *</label><input className="field" placeholder="Road 5, Block A..." value={reg.address||''} onChange={e=>sf('address',e.target.value)}/></div>
                  <div className="g2">
                    <div className="fg"><label className="fl">{t(lang,'businessPhone')} *</label><input className="field" type="tel" value={reg.shopPhone||''} onChange={e=>sf('shopPhone',e.target.value)}/></div>
                    <div className="fg"><label className="fl">{t(lang,'businessEmail')}</label><input className="field" type="email" value={reg.shopEmail||''} onChange={e=>sf('shopEmail',e.target.value)}/></div>
                  </div>
                </div>
              )}

              {step===1&&(
                <div style={{display:'flex',flexDirection:'column',gap:11}}>
                  <div className="fg"><label className="fl">{t(lang,'ownerName')} *</label><input className="field" placeholder="MD. Rakibul Hasan" value={reg.ownerName||''} onChange={e=>sf('ownerName',e.target.value)}/></div>
                  <div className="g2">
                    <div className="fg"><label className="fl">{t(lang,'personalPhone')} *</label><input className="field" type="tel" value={reg.ownerPhone||''} onChange={e=>sf('ownerPhone',e.target.value)}/></div>
                    <div className="fg"><label className="fl">{t(lang,'personalEmail')}</label><input className="field" type="email" value={reg.ownerEmail||''} onChange={e=>sf('ownerEmail',e.target.value)}/></div>
                  </div>
                  <div className="g2">
                    <div className="fg"><label className="fl">{t(lang,'nationalId')} *</label><input className="field" placeholder="NID number" value={reg.nid||''} onChange={e=>sf('nid',e.target.value)}/></div>
                    <div className="fg"><label className="fl">{t(lang,'dob')} *</label><input className="field" type="date" value={reg.dob||''} onChange={e=>sf('dob',e.target.value)}/></div>
                  </div>
                  <div className="fg"><label className="fl">{t(lang,'gender')}</label>
                    <select className="field" value={reg.gender||''} onChange={e=>sf('gender',e.target.value)}>
                      <option value="">{t(lang,'select')}</option>
                      <option value="Male">{t(lang,'male')}</option>
                      <option value="Female">{t(lang,'female')}</option>
                      <option value="Other">{t(lang,'other')}</option>
                    </select>
                  </div>
                </div>
              )}

              {step===2&&(
                <form onSubmit={doReg} style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div className="ib"><i className="fas fa-store" style={{flexShrink:0}}/><span>{t(lang,'creatingFor')} <strong>{reg.shopName}</strong></span></div>
                  <div className="fg">
                    <label className="fl">{t(lang,'loginPhone')} *</label>
                    <div style={{display:'flex',gap:8}}>
                      <select className="field" style={{width:'min(110px,32%)',flexShrink:0}} value={rCc} onChange={e=>setRCc(e.target.value)}>
                        {CC.map(c=><option key={c.v} value={c.v}>{c.l}</option>)}
                      </select>
                      <input className="field" type="tel" placeholder="01XXXXXXXXX" value={rPh} onChange={e=>setRPh(e.target.value)} style={{flex:1,minWidth:0}}/>
                    </div>
                  </div>
                  <div className="fg"><label className="fl">{t(lang,'passwordMin')}</label><input className="field" type="password" placeholder="••••••••" value={reg.password||''} onChange={e=>sf('password',e.target.value)}/></div>
                  <div className="fg"><label className="fl">{t(lang,'confirmPassword')} *</label><input className="field" type="password" placeholder="••••••••" value={cPw} onChange={e=>setCPw(e.target.value)}/></div>
                  <label style={{display:'flex',alignItems:'flex-start',gap:8,fontSize:'.75rem',color:'var(--t2)',cursor:'pointer',lineHeight:1.55}}>
                    <input type="checkbox" checked={ok} onChange={e=>setOk(e.target.checked)} style={{accentColor:'var(--p)',width:15,height:15,flexShrink:0,marginTop:2}}/>
                    <span>{t(lang,'agreeTerms')}</span>
                  </label>
                  {rErr&&<div className="eb"><i className="fas fa-exclamation-circle" style={{flexShrink:0}}/>{rErr}</div>}
                  <button className="btn btn-gr btn-full" type="submit" disabled={rLd} style={{padding:'12px',fontSize:'.87rem'}}>
                    {rLd?<><span className="spin"/> {t(lang,'completing')}</>:<><i className="fas fa-check-circle"/> {t(lang,'completeReg')}</>}
                  </button>
                </form>
              )}

              {rErr&&step<2&&<div className="eb" style={{marginTop:10}}><i className="fas fa-exclamation-circle" style={{flexShrink:0}}/>{rErr}</div>}
              {step<2&&(
                <div style={{display:'flex',gap:8,marginTop:14}}>
                  {step>0&&<button className="btn btn-gh" style={{flex:1}} type="button" onClick={()=>{setRErr('');setStep(s=>s-1)}}><i className="fas fa-arrow-left"/> {t(lang,'back')}</button>}
                  <button className="btn btn-p" style={{flex:1}} type="button" onClick={nxt}>{t(lang,'next')} <i className="fas fa-arrow-right"/></button>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{textAlign:'center',marginTop:14,fontSize:'.65rem',color:'var(--t3)',fontWeight:700,letterSpacing:'.03em'}}>
          DigitalBoi POS v2.0 · {t(lang,'appSub')}
        </div>
      </div>
    </div>
  )
}
