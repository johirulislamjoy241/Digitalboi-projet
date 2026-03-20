'use client'
import { useAuth } from '@/lib/auth-context'
import { useAppStore } from '@/lib/app-store'
import { useToast } from '@/lib/toast-context'
import { t } from '@/lib/i18n'

const PAGE_KEYS: Record<string, keyof typeof import('@/lib/i18n').T['en']> = {
  dashboard:'dashboard', inventory:'inventory', transactions:'transactions',
  txhistory:'txHistory', dueledger:'dueLedger', reports:'reports',
  settings:'settingsNav', security:'security', directions:'help',
  privacy:'privacy', disclaimer:'disclaimer', terms:'terms',
}
const PAGE_ICONS: Record<string,string> = {
  dashboard:'📊', inventory:'📦', transactions:'🔄', txhistory:'📋',
  dueledger:'📒', reports:'📈', settings:'⚙️', security:'🔒',
  directions:'❓', privacy:'🔐', disclaimer:'⚠️', terms:'📄',
}

export default function Topbar(){
  const {user}=useAuth()
  const {activeSection,toggleSidebar,theme,setTheme,lang}=useAppStore()
  const {toast}=useToast()

  const pageTitle = t(lang, PAGE_KEYS[activeSection] || 'dashboard')
  const pageIcon = PAGE_ICONS[activeSection] || '📄'

  function getGreeting(){
    const h=new Date().getHours()
    const key = h<12 ? 'morning' : h<17 ? 'afternoon' : h<21 ? 'evening' : 'night'
    return t(lang, key as keyof typeof import('@/lib/i18n').T['en'])
  }

  function toggleTheme(){
    const n=theme==='light'?'dark':'light'
    setTheme(n)
    toast(n==='dark'?'🌙 Dark mode':'☀️ Light mode','in')
  }

  const av=user?.shop_name?.charAt(0).toUpperCase()||'D'

  return(
    <header className="topbar">
      <button className="tb-mb" onClick={toggleSidebar} aria-label="Menu">
        <i className="fas fa-bars"/>
      </button>

      <div className="tb-info">
        <div className="tb-pg">{pageIcon} {pageTitle}</div>
        {activeSection==='dashboard'&&user&&(
          <div className="tb-sg">{getGreeting()}, {user.owner_name}</div>
        )}
      </div>

      <div className="tb-acts">
        <button className="tb-btn" onClick={toggleTheme} title="Toggle theme">
          <i className={`fas fa-${theme==='dark'?'sun':'moon'}`}/>
        </button>
        {user&&(
          <div className="tb-av" title={user.shop_name}>{av}</div>
        )}
      </div>
    </header>
  )
}
