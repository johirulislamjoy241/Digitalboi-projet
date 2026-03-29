'use client'
import { useState } from 'react'
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
import {
  Home as HomeIcon, Package, ScanLine, BookOpen, BarChart2,
  MoreHorizontal, ArrowLeftRight, History, Settings, Shield,
  HelpCircle, Lock, FileText, AlertCircle
} from 'lucide-react'

const MAIN_NAV: { id: ActiveSection; icon: any; label: string; isCenter?: boolean }[] = [
  { id: 'dashboard',  icon: HomeIcon,   label: 'হোম' },
  { id: 'inventory',  icon: Package,    label: 'পণ্য' },
  { id: 'pos',        icon: ScanLine,   label: 'POS', isCenter: true },
  { id: 'dueledger',  icon: BookOpen,   label: 'বকেয়া' },
  { id: 'reports',    icon: BarChart2,  label: 'রিপোর্ট' },
]

const MORE_NAV: { id: ActiveSection; icon: any; label: string }[] = [
  { id: 'transactions', icon: ArrowLeftRight, label: 'লেনদেন' },
  { id: 'txhistory',    icon: History,        label: 'ইতিহাস' },
  { id: 'settings',     icon: Settings,       label: 'সেটিংস' },
  { id: 'security',     icon: Shield,         label: 'নিরাপত্তা' },
  { id: 'directions',   icon: HelpCircle,     label: 'সাহায্য' },
  { id: 'privacy',      icon: Lock,           label: 'গোপনীয়তা' },
  { id: 'disclaimer',   icon: AlertCircle,    label: 'দাবিত্যাগ' },
  { id: 'terms',        icon: FileText,       label: 'শর্তাবলী' },
]

const MORE_IDS = MORE_NAV.map(x => x.id)

function AppShellInner() {
  const { activeSection, setActiveSection } = useAppStore()
  const [showMore, setShowMore] = useState(false)

  const isMoreActive = MORE_IDS.includes(activeSection)
  const isPOS = activeSection === 'pos'
  const allSidebarItems = [...MAIN_NAV, ...MORE_NAV]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Topbar />

      <div className="app-body">
        {/* Sidebar — desktop only */}
        <aside className="app-sidebar">
          {MAIN_NAV.map(item => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                className={`sidebar-item${isActive ? (item.isCenter ? ' pos-item' : ' active') : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </button>
            )
          })}
          <div className="sidebar-divider" />
          <div className="sidebar-label">আরো</div>
          {MORE_NAV.map(item => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                className={`sidebar-item${isActive ? ' active' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </button>
            )
          })}
        </aside>

        {/* Main content */}
        <main className={`main-content${isPOS ? ' is-pos' : ''}`}>
          <div className="main-content-inner" style={{ animation: 'fade-up 0.25s cubic-bezier(0.16,1,0.3,1) both' }} key={activeSection}>
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
          </div>
        </main>
      </div>

      {/* Bottom Nav — mobile/tablet only */}
      <nav className="bottom-nav">
        {MAIN_NAV.map(item => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          if (item.isCenter) {
            return (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
                <button
                  className="nav-scan-btn"
                  onClick={() => setActiveSection(item.id)}
                  style={{
                    background: isActive ? 'var(--success)' : undefined,
                    boxShadow: isActive ? '0 6px 20px rgba(0,200,83,0.4)' : undefined,
                  }}
                  aria-label="POS"
                >
                  <Icon size={22} strokeWidth={2.5} />
                </button>
                <span className="nav-item-label" style={{ color: isActive ? 'var(--success)' : 'var(--text3)' }}>{item.label}</span>
              </div>
            )
          }
          return (
            <button key={item.id} className={`nav-item${isActive ? ' active' : ''}`} onClick={() => setActiveSection(item.id)} aria-label={item.label}>
              <div className="nav-item-icon"><Icon size={20} strokeWidth={isActive ? 2.5 : 2} /></div>
              <span className="nav-item-label">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* More FAB — mobile only */}
      <button
        className="more-fab"
        onClick={() => setShowMore(true)}
        style={{
          position: 'fixed',
          bottom: 'calc(var(--nav-h) + env(safe-area-inset-bottom, 0px) + 10px)',
          left: 12,
          width: 40, height: 40, borderRadius: 12,
          background: isMoreActive ? 'var(--primary)' : 'var(--surface)',
          border: `1.5px solid ${isMoreActive ? 'var(--primary)' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isMoreActive ? 'white' : 'var(--text3)',
          boxShadow: 'var(--shadow)', cursor: 'pointer', zIndex: 150, transition: 'all 0.2s'
        }}
        aria-label="আরো"
      >
        <MoreHorizontal size={18} />
      </button>

      {showMore && <MoreMenu onClose={() => setShowMore(false)} />}
    </div>
  )
}

function AuthGate() {
  const { user, loading } = useAuth()

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

  return (
    <AppProvider key={user.id}>
      <AppShellInner />
    </AppProvider>
  )
}

export default function Home() {
  return (
    <ToastProvider>
      <AuthGate />
    </ToastProvider>
  )
}
