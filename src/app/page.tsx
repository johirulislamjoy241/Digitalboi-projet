'use client'
import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AppProvider,useAppStore } from '@/lib/app-store'
import { ToastProvider } from '@/lib/toast-context'
import AuthScreen from '@/components/AuthScreen'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import DashboardSection from '@/components/sections/Dashboard'
import InventorySection from '@/components/sections/Inventory'
import TransactionsSection from '@/components/sections/Transactions'
import TxHistorySection from '@/components/sections/TxHistory'
import DueLedgerSection from '@/components/sections/DueLedger'
import ReportsSection from '@/components/sections/Reports'
import SettingsSection from '@/components/sections/Settings'
import { SecuritySection,HelpSection,PrivacySection,DisclaimerSection,TermsSection } from '@/components/sections/StaticSections'
function AppShell(){
  const {user,loading}=useAuth()
  const {activeSection}=useAppStore()
  useEffect(()=>{try{const t=localStorage.getItem('db_theme')||'light';document.documentElement.setAttribute('data-theme',t)}catch{}},[])
  if(loading)return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#f4f3ff'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:58,height:58,background:'linear-gradient(135deg,#6c63ff,#a78bfa)',borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',margin:'0 auto 18px',boxShadow:'0 8px 28px rgba(108,99,255,.4)',animation:'pulse-glow 3s ease-in-out infinite'}}>📦</div>
        <div className="spin-p" style={{width:20,height:20,border:'2.5px solid rgba(108,99,255,.2)',borderTopColor:'#6c63ff',borderRadius:'50%',animation:'rot .65s linear infinite',margin:'0 auto'}}/>
      </div>
    </div>
  )
  if(!user)return <AuthScreen/>
  return(
    <div className="app-layout">
      <Sidebar/>
      <div className="main-content">
        <Topbar/>
        <main className="pg">
          {activeSection==='dashboard'    &&<DashboardSection/>}
          {activeSection==='inventory'    &&<InventorySection/>}
          {activeSection==='transactions' &&<TransactionsSection/>}
          {activeSection==='txhistory'    &&<TxHistorySection/>}
          {activeSection==='dueledger'    &&<DueLedgerSection/>}
          {activeSection==='reports'      &&<ReportsSection/>}
          {activeSection==='settings'     &&<SettingsSection/>}
          {activeSection==='security'     &&<SecuritySection/>}
          {activeSection==='directions'   &&<HelpSection/>}
          {activeSection==='privacy'      &&<PrivacySection/>}
          {activeSection==='disclaimer'   &&<DisclaimerSection/>}
          {activeSection==='terms'        &&<TermsSection/>}
        </main>
      </div>
    </div>
  )
}
export default function Home(){return <ToastProvider><AppProvider><AppShell/></AppProvider></ToastProvider>}
