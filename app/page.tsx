'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AppProvider, useAppStore } from '@/lib/app-store'
import AuthScreen from '@/components/AuthScreen'
import Topbar from '@/components/layout/Topbar'
import Sidebar from '@/components/layout/Sidebar'
import DashboardSection from '@/components/sections/Dashboard'
import InventorySection from '@/components/sections/Inventory'
import POSSection from '@/components/sections/POS'
import TransactionsSection from '@/components/sections/Transactions'
import TxHistorySection from '@/components/sections/TxHistory'
import DueLedgerSection from '@/components/sections/DueLedger'
import ReportsSection from '@/components/sections/Reports'
import SettingsSection from '@/components/sections/Settings'
import { SecuritySection, HelpSection, PrivacySection, DisclaimerSection, TermsSection } from '@/components/sections/StaticSections'

function AppShellInner() {
  const { activeSection } = useAppStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isPOS = activeSection === 'pos'

  return (
    <div className="app-root">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Topbar onMenuOpen={() => setSidebarOpen(true)} />
        <main
          key={activeSection}
          className="app-content"
          style={{
            overflowY: isPOS ? 'hidden' : 'auto',
            padding: isPOS ? 0 : undefined,
            height: isPOS ? 0 : undefined,
            flex: isPOS ? '1 1 0%' : undefined,
            animation: 'fade-up 0.22s cubic-bezier(0.16,1,0.3,1) both',
          }}
        >
          {activeSection === 'dashboard'    && <DashboardSection />}
          {activeSection === 'inventory'    && <InventorySection />}
          {activeSection === 'pos'          && <POSSection />}
          {activeSection === 'transactions' && <TransactionsSection />}
          {activeSection === 'txhistory'    && <TxHistorySection />}
          {activeSection === 'dueledger'    && <DueLedgerSection />}
          {activeSection === 'reports'      && <ReportsSection />}
          {activeSection === 'settings'     && <SettingsSection />}
          {activeSection === 'security'     && <SecuritySection />}
          {activeSection === 'directions'   && <HelpSection />}
          {activeSection === 'privacy'      && <PrivacySection />}
          {activeSection === 'disclaimer'   && <DisclaimerSection />}
          {activeSection === 'terms'        && <TermsSection />}
        </main>
      </div>
    </div>
  )
}

function AuthGate() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="loader-screen">
      <div className="loader-logo">📦</div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-bn)' }}>Digiboi</div>
      <div className="loader-bar"><div className="loader-bar-fill" /></div>
    </div>
  )
  if (!user) return <AuthScreen />
  return (
    <AppProvider key={user.id}>
      <AppShellInner />
    </AppProvider>
  )
}

export default function Home() {
  return <AuthGate />
}
