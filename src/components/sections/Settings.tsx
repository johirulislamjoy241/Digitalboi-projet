'use client'
import { useAppStore } from '@/lib/app-store'
import { useToast } from '@/lib/toast-context'
import { CURRENCIES } from '@/lib/utils'
import { t, type Lang } from '@/lib/i18n'

const LANGS: {code: Lang; label: string; flag: string}[] = [
  {code:'en', label:'English', flag:'🇬🇧'},
  {code:'bn', label:'বাংলা', flag:'🇧🇩'},
]

export default function SettingsSection(){
  const {theme,setTheme,lang,setLang,currency,setCurrency,lowStockThreshold,setLowStockThreshold}=useAppStore()
  const {toast}=useToast()

  const iconBox=(bg:string,color:string,icon:string)=>(
    <div style={{width:38,height:38,borderRadius:11,background:bg,display:'flex',alignItems:'center',justifyContent:'center',color,fontSize:'.9rem',flexShrink:0}}>
      <i className={icon}/>
    </div>
  )

  return(
    <div style={{display:'flex',flexDirection:'column',gap:14,maxWidth:600,width:'100%'}}>

      {/* Language */}
      <div className="card cp sec-in">
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
          {iconBox('var(--p-l)','var(--p)','fas fa-globe')}
          <div><div className="ct">{t(lang,'language')}</div><div className="cs">{t(lang,'languageDesc')}</div></div>
        </div>
        <div className="fg">
          <label className="fl">{t(lang,'language')}</label>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {LANGS.map(l=>(
              <button
                key={l.code}
                onClick={()=>{setLang(l.code);toast(`${l.flag} ${l.label} applied`,'in')}}
                style={{
                  display:'flex',alignItems:'center',gap:8,padding:'9px 16px',
                  borderRadius:10,border:'1.5px solid',
                  borderColor:lang===l.code?'var(--p)':'var(--line2)',
                  background:lang===l.code?'var(--p-pale)':'var(--s2)',
                  color:lang===l.code?'var(--p)':'var(--t2)',
                  fontWeight:700,fontSize:'.82rem',cursor:'pointer',
                  transition:'all .15s',fontFamily:'inherit',
                }}
              >
                <span style={{fontSize:'1rem'}}>{l.flag}</span>
                <span>{l.label}</span>
                {lang===l.code&&<i className="fas fa-check" style={{fontSize:'.72rem'}}/>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="card cp sec-in sec-in-d1">
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
          {iconBox('var(--p-l)','var(--p)','fas fa-palette')}
          <div><div className="ct">{t(lang,'appearance')}</div><div className="cs">{t(lang,'themeDesc')}</div></div>
        </div>
        <div className="fg">
          <label className="fl">{t(lang,'theme')}</label>
          <div className="tog-w" style={{maxWidth:240}}>
            <button className={'tog-b '+(theme==='light'?'on':'')} onClick={()=>{setTheme('light');toast('☀️ Light mode','in')}}>
              <i className="fas fa-sun"/> {t(lang,'light')}
            </button>
            <button className={'tog-b '+(theme==='dark'?'on':'')} onClick={()=>{setTheme('dark');toast('🌙 Dark mode','in')}}>
              <i className="fas fa-moon"/> {t(lang,'dark')}
            </button>
          </div>
        </div>
      </div>

      {/* Currency */}
      <div className="card cp sec-in sec-in-d1">
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
          {iconBox('var(--amber-l)','var(--amber)','fas fa-coins')}
          <div><div className="ct">{t(lang,'currency')}</div><div className="cs">{t(lang,'currencyDesc')}</div></div>
        </div>
        <div className="fg">
          <label className="fl">{t(lang,'selectCurrency')}</label>
          <select className="field" value={currency} onChange={e=>{setCurrency(e.target.value);toast(`Currency: ${e.target.value}`,'ok')}} style={{maxWidth:300}}>
            {Object.entries(CURRENCIES).map(([c,i])=><option key={c} value={c}>{i.symbol} {c} — {i.name}</option>)}
          </select>
          <div className="fh">{t(lang,'current')}: <strong style={{color:'var(--p)'}}>{CURRENCIES[currency]?.symbol} {currency}</strong></div>
        </div>
      </div>

      {/* Low stock threshold */}
      <div className="card cp sec-in sec-in-d2">
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
          {iconBox('var(--teal-l)','var(--teal)','fas fa-boxes')}
          <div><div className="ct">{t(lang,'inventorySettings')}</div><div className="cs">{t(lang,'lowStockThreshold')}</div></div>
        </div>
        <div className="fg">
          <label className="fl">{t(lang,'lowStockThreshold')}</label>
          <input className="field" type="number" min="1" max="999" value={lowStockThreshold} onChange={e=>setLowStockThreshold(parseInt(e.target.value)||10)} style={{maxWidth:120}}/>
          <div className="fh">{t(lang,'thresholdDesc')} <strong>{lowStockThreshold}</strong> {t(lang,'thresholdDesc2')}</div>
        </div>
      </div>

      {/* App info */}
      <div className="card cp sec-in sec-in-d3">
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
          {iconBox('var(--p-l)','var(--p)','fas fa-info-circle')}
          <div><div className="ct">{t(lang,'appInfo')}</div></div>
        </div>
        {[
          [t(lang,'app'),'DigitalBoi POS v2.0'],
          [t(lang,'brand'),'Digital Boi — ডিজিটাল বই'],
          [t(lang,'stack'),'Next.js 14 + Supabase PostgreSQL'],
          [t(lang,'developer'),'MD. Rakibul Hasan Rony'],
        ].map(([l,v])=>(
          <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:'1px solid var(--line)',fontSize:'.81rem',gap:12,flexWrap:'wrap'}}>
            <span style={{color:'var(--t3)',fontWeight:600,flexShrink:0}}>{l}</span>
            <strong style={{color:'var(--t1)',textAlign:'right'}}>{v}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}
