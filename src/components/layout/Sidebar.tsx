'use client'
import { useAuth } from '@/lib/auth-context'
import { useAppStore, type ActiveSection } from '@/lib/app-store'
import { useToast } from '@/lib/toast-context'
import { t } from '@/lib/i18n'

const MAIN_NAV=[
  {id:'dashboard'    as ActiveSection, ico:'fas fa-chart-pie'},
  {id:'inventory'    as ActiveSection, ico:'fas fa-boxes'},
  {id:'transactions' as ActiveSection, ico:'fas fa-exchange-alt'},
  {id:'txhistory'    as ActiveSection, ico:'fas fa-history'},
  {id:'dueledger'    as ActiveSection, ico:'fas fa-book-open'},
  {id:'reports'      as ActiveSection, ico:'fas fa-chart-bar'},
]
const SET_NAV=[
  {id:'settings'   as ActiveSection, ico:'fas fa-sliders-h'},
  {id:'security'   as ActiveSection, ico:'fas fa-shield-alt'},
  {id:'directions' as ActiveSection, ico:'fas fa-question-circle'},
]
const LEG_NAV=[
  {id:'privacy'    as ActiveSection, ico:'fas fa-lock'},
  {id:'disclaimer' as ActiveSection, ico:'fas fa-exclamation-triangle'},
  {id:'terms'      as ActiveSection, ico:'fas fa-file-contract'},
]

const NAV_KEYS: Record<string, keyof typeof import('@/lib/i18n').T['en']> = {
  dashboard:'dashboard', inventory:'inventory', transactions:'transactions',
  txhistory:'txHistory', dueledger:'dueLedger', reports:'reports',
  settings:'settingsNav', security:'security', directions:'help',
  privacy:'privacy', disclaimer:'disclaimer', terms:'terms',
}

export default function Sidebar(){
  const {user,logout}=useAuth()
  const {activeSection,setActiveSection,sidebarOpen,setSidebarOpen,lang}=useAppStore()
  const {toast}=useToast()

  function nav(id:ActiveSection){setActiveSection(id);setSidebarOpen(false)}
  async function doOut(){await logout();toast(lang==='bn'?'সাইন আউট সফল':'Signed out successfully','in')}
  const av=user?.shop_name?.charAt(0).toUpperCase()||'D'

  return(
    <>
      <div className={'sb-over '+(sidebarOpen?'show':'')} onClick={()=>setSidebarOpen(false)}/>
      <aside className={'sidebar '+(sidebarOpen?'open':'')}>

        {/* Brand */}
        <div className="sb-head">
          <div className="sb-brand">
            <div className="sb-logo">📦</div>
            <div>
              <div className="sb-app-name">{t(lang,'appName')}</div>
              <div className="sb-app-tagline">{t(lang,'appTagline')}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sb-nav">
          <div className="sb-sec">{t(lang,'mainMenu')}</div>
          {MAIN_NAV.map(n=>(
            <button key={n.id} className={'ni '+(activeSection===n.id?'on':'')} onClick={()=>nav(n.id)}>
              <i className={n.ico}/>
              <span>{t(lang, NAV_KEYS[n.id] as keyof typeof import('@/lib/i18n').T['en'])}</span>
            </button>
          ))}
          <div className="sb-sec" style={{marginTop:8}}>{t(lang,'settings')}</div>
          {SET_NAV.map(n=>(
            <button key={n.id} className={'ni '+(activeSection===n.id?'on':'')} onClick={()=>nav(n.id)}>
              <i className={n.ico}/>
              <span>{t(lang, NAV_KEYS[n.id] as keyof typeof import('@/lib/i18n').T['en'])}</span>
            </button>
          ))}
          <div className="sb-sec" style={{marginTop:8}}>{t(lang,'legal')}</div>
          {LEG_NAV.map(n=>(
            <button key={n.id} className={'ni '+(activeSection===n.id?'on':'')} onClick={()=>nav(n.id)}>
              <i className={n.ico}/>
              <span>{t(lang, NAV_KEYS[n.id] as keyof typeof import('@/lib/i18n').T['en'])}</span>
            </button>
          ))}
        </nav>

        {/* Profile + Sign out at bottom */}
        <div className="sb-bottom">
          {user&&(
            <div className="sb-profile">
              <div className="sb-av">{av}</div>
              <div style={{flex:1,minWidth:0}}>
                <div className="sb-shop">{user.shop_name}</div>
                <div className="sb-owner">{user.owner_name}</div>
              </div>
              <div style={{width:8,height:8,borderRadius:'50%',background:'#4ade80',flexShrink:0}}/>
            </div>
          )}
          <button className="sb-out" onClick={doOut}>
            <i className="fas fa-sign-out-alt"/>
            <span>{t(lang,'signOut')}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
