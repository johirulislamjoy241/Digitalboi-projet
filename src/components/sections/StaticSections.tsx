'use client'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'
import { useAppStore } from '@/lib/app-store'
import { t } from '@/lib/i18n'

export function SecuritySection(){
  const {user,logout}=useAuth()
  const {toast}=useToast()
  const {lang}=useAppStore()
  return(
    <div style={{display:'flex',flexDirection:'column',gap:14,maxWidth:540,width:'100%'}}>
      <div className="card cp sec-in">
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
          <div style={{width:38,height:38,borderRadius:11,background:'var(--p-l)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--p)',fontSize:'.9rem',flexShrink:0}}><i className="fas fa-id-card"/></div>
          <div><div className="ct">{t(lang,'sessionInfo')}</div><div className="cs">{t(lang,'currentLogin')}</div></div>
        </div>
        {([
          [t(lang,'shopName'), user?.shop_name||'—'],
          [t(lang,'ownerNameLbl'), user?.owner_name||'—'],
          [t(lang,'phoneLbl'), user?.phone||'—'],
          [t(lang,'accountCreated'), user?.created_at?new Date(user.created_at).toLocaleDateString('en-GB'):'—'],
        ] as [string,string][]).map(([l,v])=>(
          <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:'1px solid var(--line)',fontSize:'.81rem',gap:12,flexWrap:'wrap'}}>
            <span style={{color:'var(--t2)',fontWeight:600,flexShrink:0}}>{l}</span>
            <strong style={{color:'var(--t1)',textAlign:'right'}}>{v}</strong>
          </div>
        ))}
      </div>
      <div className="card cp sec-in sec-in-d1">
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
          <div style={{width:38,height:38,borderRadius:11,background:'var(--green-l)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--green)',fontSize:'.9rem',flexShrink:0}}><i className="fas fa-shield-alt"/></div>
          <div><div className="ct">{t(lang,'securityTips')}</div><div className="cs">{t(lang,'keepSafe')}</div></div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {[
            'Never share your password with anyone.',
            'Always sign out after using a shared device.',
            'Use a strong password (at least 8 characters).',
            'Regularly export CSV to back up your data.',
            'Change your password if you suspect unauthorized access.',
          ].map((tip,i)=>(
            <div key={i} style={{display:'flex',gap:9,alignItems:'flex-start',fontSize:'.79rem',color:'var(--t2)'}}>
              <div style={{width:20,height:20,borderRadius:6,background:'var(--green-l)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                <i className="fas fa-check" style={{fontSize:'.58rem',color:'var(--green)'}}/>
              </div>
              <span style={{lineHeight:1.6}}>{tip}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card cp sec-in sec-in-d2">
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
          <div style={{width:38,height:38,borderRadius:11,background:'var(--acc-l)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--rose)',fontSize:'.9rem',flexShrink:0}}><i className="fas fa-exclamation-triangle"/></div>
          <div><div className="ct" style={{color:'var(--rose)'}}>{t(lang,'sessionControl')}</div></div>
        </div>
        <button className="btn btn-rd" onClick={async()=>{await logout();toast('Signed out successfully','in')}}>
          <i className="fas fa-sign-out-alt"/> {t(lang,'signOutNow')}
        </button>
      </div>
    </div>
  )
}

export function HelpSection(){
  const {lang}=useAppStore()
  const items=[
    {e:'📦',title:'Inventory Management',c:'Go to Inventory → click "Add New". Enter name, category, quantity, buy price and sell price. Use Stock In/Out to change stock levels.',col:'var(--p)',bg:'var(--p-l)'},
    {e:'🔄',title:'Stock Transactions',c:'Use "Stock In" to add new stock. Use "Stock Out" to record a sale. The system automatically calculates profit/loss and warns if selling below buy price.',col:'var(--teal)',bg:'var(--teal-l)'},
    {e:'📒',title:'Due Ledger',c:'First add a buyer in "Buyer Profiles". Then record a due sale with "New Due Sale". Use the "Pay" button to record partial or full payments.',col:'var(--green)',bg:'var(--green-l)'},
    {e:'📊',title:'Reports & Analytics',c:'View category-wise stock, value and profit charts. Export full inventory or transaction records as CSV files for offline use.',col:'var(--amber)',bg:'var(--amber-l)'},
    {e:'⚙️',title:'Settings',c:'Change currency (BDT, USD, EUR etc.), switch between Light/Dark theme, and set the low stock alert threshold.',col:'var(--p)',bg:'var(--p-l)'},
    {e:'🌐',title:'Language',c:'Go to Settings → Language. Switch between English and Bengali (বাংলা). The entire interface updates immediately.',col:'var(--teal)',bg:'var(--teal-l)'},
  ]
  return(
    <div style={{display:'flex',flexDirection:'column',gap:12,maxWidth:640,width:'100%'}}>
      {items.map((s,i)=>(
        <div key={s.title} className="card cp sec-in" style={{animationDelay:`${i*.06}s`,opacity:0}}>
          <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
            <div style={{width:42,height:42,borderRadius:13,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',flexShrink:0}}>{s.e}</div>
            <div style={{flex:1,minWidth:0}}>
              <div className="ct" style={{color:s.col,marginBottom:5}}>{s.title}</div>
              <div style={{fontSize:'.79rem',color:'var(--t2)',lineHeight:1.8}}>{s.c}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function LCard({e,title,date,secs}:{e:string;title:string;date:string;secs:{title:string;c:string;col:string}[]}){
  return(
    <div style={{display:'flex',flexDirection:'column',gap:12,maxWidth:650,width:'100%'}}>
      <div style={{background:'linear-gradient(135deg,var(--p-pale),#ddd6fe)',border:'1.5px solid var(--line2)',borderRadius:'var(--r2)',padding:'18px',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
        <div style={{width:52,height:52,background:'linear-gradient(135deg,var(--p),#a78bfa)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',flexShrink:0,boxShadow:'0 4px 16px rgba(108,99,255,.35)'}}>{e}</div>
        <div><div style={{fontSize:'1rem',fontWeight:900,color:'var(--t1)'}}>{title}</div><div style={{fontSize:'.7rem',color:'var(--t3)',marginTop:3,fontWeight:600}}>Last updated: {date}</div></div>
      </div>
      {secs.map((s,i)=>(
        <div key={s.title} className="card cp sec-in" style={{animationDelay:`${i*.06}s`,opacity:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:9}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:s.col,flexShrink:0}}/>
            <div style={{fontWeight:800,fontSize:'.86rem',color:s.col}}>{s.title}</div>
          </div>
          <div style={{fontSize:'.79rem',color:'var(--t2)',lineHeight:1.85,paddingLeft:18}}>{s.c}</div>
        </div>
      ))}
    </div>
  )
}

export function PrivacySection(){
  return <LCard e="🔐" title="Privacy Policy" date="March 10, 2026" secs={[
    {title:'1. Data Collection',col:'var(--p)',c:'DigitalBoi only collects business-related information: shop name, owner name, phone number, NID and address.'},
    {title:'2. Data Security',col:'var(--teal)',c:'All your data is securely stored in Supabase PostgreSQL with encryption. No data is shared with third parties.'},
    {title:'3. Data Control',col:'var(--amber)',c:'You can export your data as CSV at any time. Contact the developer to permanently delete your account.'},
  ]}/>
}

export function DisclaimerSection(){
  return <LCard e="⚠️" title="Disclaimer" date="March 10, 2026" secs={[
    {title:'1. General Information',col:'var(--amber)',c:'DigitalBoi is a business assistant app. Information displayed here should not be considered professional financial or legal advice.'},
    {title:'2. Data Accuracy',col:'var(--rose)',c:'All information depends on data entered by the user. Profit, loss and reports are calculated based on your inputs.'},
    {title:'3. User Responsibility',col:'var(--p)',c:'The user is solely responsible for the security of their account and confidentiality of business information.'},
  ]}/>
}

export function TermsSection(){
  return <LCard e="📋" title="Terms of Service" date="March 10, 2026" secs={[
    {title:'1. Eligibility',col:'var(--teal)',c:'You must be at least 18 years old and register with accurate information to use DigitalBoi.'},
    {title:'2. Permitted Use ✅',col:'var(--p)',c:'Product inventory management, sales and purchase records, due payment tracking, and business reports.'},
    {title:'3. Prohibited Activities ❌',col:'var(--rose)',c:'False registration, recording illegal activities, unauthorized access to other accounts.'},
    {title:'4. Contact',col:'var(--p)',c:'📘 facebook.com/DigiboiApp | Developer: MD. Rakibul Hasan Rony'},
  ]}/>
}
