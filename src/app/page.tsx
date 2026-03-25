'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AppProvider, useAppStore, type ActiveSection } from '@/lib/app-store'
import { ToastProvider } from '@/lib/toast-context'
import AuthScreen from '@/components/AuthScreen'
import Topbar from '@/components/layout/Topbar'
import MoreMenu from '@/components/layout/MoreMenu'
import DashboardSection from '@/components/sections/Dashboard'
import InventorySection from '@/components/sections/Inventory'
import POSSection from '@/components/sections/POS'
import TransactionsSection from '@/components/sections/Transactions'
import TxHistorySection from '@/components/sections/TxHistory'
import DueLedgerSection from '@/components/sections/DueLedger'
import ReportsSection from '@/components/sections/Reports'
import SettingsSection from '@/components/sections/Settings'
import { SecuritySection, HelpSection, PrivacySection, DisclaimerSection, TermsSection } from '@/components/sections/StaticSections'

// Home আইকনটিকে HomeIcon হিসেবে রিনেম করা হলো কনফ্লিক্ট এড়াতে
import { Home as HomeIcon, Package, ScanLine, BookOpen, BarChart2, MoreHorizontal } from 'lucide-react'

// Bottom nav items
const BOTTOM_NAV = [
  { id: 'dashboard' as ActiveSection, icon: HomeIcon, label: 'হোম' },
  { id: 'inventory' as ActiveSection, icon: Package, label: 'পণ্য' },
  { id: 'pos' as ActiveSection, icon: ScanLine, label: 'POS', isCenter: true },
  { id: 'dueledger' as ActiveSection, icon: BookOpen, label: 'বকেয়া' },
  { id: 'reports' as ActiveSection, icon: BarChart2, label: 'রিপোর্ট' },
]

const MORE_SECTIONS = ['transactions', 'txhistory', 'settings', 'security', 'directions', 'privacy', 'disclaimer', 'terms']

function AppShell() {
  const { user, loading } = useAuth()
  const { activeSection, setActiveSection } = useAppStore()
  const [showMore, setShowMore] = useState(false)

  useEffect(() => {
    try {
      const t = localStorage.getItem('db_theme') || 'light'
      document.documentElement.setAttribute('data-theme', t)
    } catch { /* ignore */ }
  }, [])

  if (loading) {
    return (
      <div className="loader-screen">
        <div className="loader-logo">📦</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-bn)' }}>Digiboi</div>
        <div className="loader-bar"><div className="loader-bar-fill" /></div>
      </div>
    )
  }

  if (!user) return <AuthScreen />

  const isMoreActive = MORE_SECTIONS.includes(activeSection)
  const isPOS = activeSection === 'pos'

  return (
    <div className="app-layout">
      <div className="main-content" style={{ height: '100dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        <main
          key={activeSection}
          style={{
            flex: 1,
            overflowY: isPOS ? 'hidden' : 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: isPOS ? 0 : '16px 16px calc(var(--nav-h) + 24px)',
            overscrollBehavior: 'contain',
            animation: 'fade-up 0.3s cubic-bezier(0.16,1,0.3,1) both'
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

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        {BOTTOM_NAV.map(item => {
          const Icon = item.icon
          const isActive = activeSection === item.id

          if (item.isCenter) {
            return (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
                <button
                  className="nav-scan-btn"
                  onClick={() => setActiveSection(item.id)}
                  style={{ background: isActive ? 'var(--success)' : undefined, boxShadow: isActive ? '0 6px 20px rgba(0,200,83,0.4)' : undefined }}
                  aria-label="POS / Scan"
                >
                  <Icon size={22} strokeWidth={2.5} />
                </button>
                <span className="nav-item-label" style={{ color: isActive ? 'var(--success)' : 'var(--text3)' }}>{item.label}</span>
              </div>
            )
          }

          return (
            <button key={item.id} className={`nav-item ${isActive ? 'active' : ''}`} onClick={() => setActiveSection(item.id)} aria-label={item.label}>
              <div className="nav-item-icon">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="nav-item-label">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* More Menu floating button */}
      <button
        onClick={() => setShowMore(true)}
        style={{
          position: 'fixed', bottom: 'calc(var(--nav-h) + 10px)', right: 12,
          width: 40, height: 40, borderRadius: 12,
          background: isMoreActive ? 'var(--primary)' : 'var(--surface)',
          border: `1.5px solid ${isMoreActive ? 'var(--primary)' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isMoreActive ? 'white' : 'var(--text3)',
          boxShadow: 'var(--shadow)', cursor: 'pointer', zIndex: 150, transition: 'all 0.2s'
        }}
        aria-label="আরো"
      >
        < MoreHorizontal size={18} />
      </button>

      {showMore && <MoreMenu onClose={() => setShowMore(false)} />}
    </div>
  )
}

export default function Home() {
  return (
    <ToastProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </ToastProvider>
  )
}
