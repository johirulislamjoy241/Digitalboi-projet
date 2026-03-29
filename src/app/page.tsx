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
  Home as HomeIcon, Package, ScanLine, BookOpen, BarChart2, MoreHorizontal,
  Receipt, History, Settings, ShieldCheck, HelpCircle, Lock, Info, FileText,
  Menu, X
} from 'lucide-react'

const BOTTOM_NAV = [
  { id: 'dashboard' as ActiveSection, icon: HomeIcon, label: 'হোম' },
  { id: 'inventory' as ActiveSection, icon: Package, label: 'পণ্য' },
  { id: 'pos' as ActiveSection, icon: ScanLine, label: 'POS', isCenter: true },
  { id: 'dueledger' as ActiveSection, icon: BookOpen, label: 'বকেয়া' },
  { id: 'reports' as ActiveSection, icon: BarChart2, label: 'রিপোর্ট' },
]

const SIDEBAR_MAIN = [
  { id: 'dashboard' as ActiveSection, icon: HomeIcon, label: 'ড্যাশবোর্ড' },
  { id: 'inventory' as ActiveSection, icon: Package, label: 'ইনভেন্টরি' },
  { id: 'pos' as ActiveSection, icon: ScanLine, label: 'পয়েন্ট অব সেল' },
  { id: 'dueledger' as ActiveSection, icon: BookOpen, label: 'বকেয়া খাতা' },
  { id: 'reports' as ActiveSection, icon: BarChart2, label: 'রিপোর্ট' },
]

const SIDEBAR_MORE = [
  { id: 'transactions' as ActiveSection, icon: Receipt, label: 'লেনদেন' },
  { id: 'txhistory' as ActiveSection, icon: History, label: 'ইতিহাস' },
  { id: 'settings' as ActiveSection, icon: Settings, label: 'সেটিংস' },
]

const SIDEBAR_INFO = [
  { id: 'security' as ActiveSection, icon: ShieldCheck, label: 'নিরাপত্তা' },
  { id: 'directions' as ActiveSection, icon: HelpCircle, label: 'সাহায্য' },
  { id: 'privacy' as ActiveSection, icon: Lock, label: 'গোপনীয়তা' },
  { id: 'disclaimer' as ActiveSection, icon: Info, label: 'ডিসক্লেইমার' },
  { id: 'terms' as ActiveSection, icon: FileText, label: 'শর্তাবলী' },
]

const MORE_SECTIONS = ['transactions', 'txhistory', 'settings', 'security', 'directions', 'privacy', 'disclaimer', 'terms']

/* ── Sidebar Nav Content (shared between desktop sidebar and mobile drawer) ── */
function SidebarNavContent({
  activeSection,
  setActiveSection,
  onNavigate,
  user,
}: {
  activeSection: ActiveSection
  setActiveSection: (s: ActiveSection) => void
  onNavigate?: () => void
  user?: { shop_name?: string; owner_name?: string } | null
}) {
  function nav(id: ActiveSection) {
    setActiveSection(id)
    onNavigate?.()
  }
  const av = user?.shop_name?.charAt(0).toUpperCase() || 'D'

  return (
    <>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">📦</div>
        <div style={{ minWidth: 0 }}>
          <div className="sidebar-brand-name">Digiboi</div>
          {user && <div className="sidebar-brand-shop">{user.shop_name}</div>}
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">প্রধান মেনু</div>
        {SIDEBAR_MAIN.map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => nav(item.id)}
            >
              <span className="nav-icon"><Icon size={17} strokeWidth={activeSection === item.id ? 2.5 : 2} /></span>
              {item.label}
            </button>
          )
        })}

        <div className="sidebar-nav-divider" />
        <div className="sidebar-section-label">আরো</div>
        {SIDEBAR_MORE.map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => nav(item.id)}
            >
              <span className="nav-icon"><Icon size={17} strokeWidth={activeSection === item.id ? 2.5 : 2} /></span>
              {item.label}
            </button>
          )
        })}

        <div className="sidebar-nav-divider" />
        <div className="sidebar-section-label">তথ্য</div>
        {SIDEBAR_INFO.map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => nav(item.id)}
            >
              <span className="nav-icon"><Icon size={17} strokeWidth={activeSection === item.id ? 2.5 : 2} /></span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {user && (
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{av}</div>
            <div style={{ minWidth: 0 }}>
              <div className="sidebar-user-name">{user.shop_name}</div>
              <div className="sidebar-user-sub">{user.owner_name}</div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ── Inner shell ── */
function AppShellInner() {
  const { activeSection, setActiveSection } = useAppStore()
  const { user } = useAuth()
  const [showMore, setShowMore] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  const isMoreActive = MORE_SECTIONS.includes(activeSection)
  const isPOS = activeSection === 'pos'

  return (
    <div className="app-layout">
      {/* ── Mobile sidebar overlay + drawer ── */}
      <div
        className={`mobile-sidebar-overlay ${mobileDrawerOpen ? 'open' : ''}`}
        onClick={() => setMobileDrawerOpen(false)}
      />
      <div className={`mobile-sidebar-drawer ${mobileDrawerOpen ? 'open' : ''}`}>
        <SidebarNavContent
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onNavigate={() => setMobileDrawerOpen(false)}
          user={user}
        />
      </div>

      {/* ── Desktop persistent sidebar ── */}
      <aside className="desktop-sidebar">
        <SidebarNavContent
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          user={user}
        />
      </aside>

      {/* ── Main content column ── */}
      <div className="desktop-content-area" style={{ position: 'relative' }}>
        <Topbar onHamburgerClick={() => setMobileDrawerOpen(v => !v)} />

        <div
          className="desktop-main-scroll"
          style={{ height: `calc(100dvh - var(--topbar-h))`, overflowY: isPOS ? 'hidden' : 'auto' }}
        >
          <main
            key={activeSection}
            className="desktop-section-pad"
            style={{
              minHeight: isPOS ? '100%' : undefined,
              padding: isPOS ? 0 : undefined,
              animation: 'fade-up 0.25s cubic-bezier(0.16,1,0.3,1) both',
              paddingBottom: isPOS ? 0 : undefined,
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

      {/* ── Mobile bottom nav ── */}
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
            <button key={item.id} className={`nav-item ${isActive ? 'active' : ''}`} onClick={() => setActiveSection(item.id)} aria-label={item.label}>
              <div className="nav-item-icon"><Icon size={20} strokeWidth={isActive ? 2.5 : 2} /></div>
              <span className="nav-item-label">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* ── Mobile More button ── */}
      <button
        onClick={() => setShowMore(true)}
        style={{
          position: 'fixed',
          bottom: 'calc(var(--nav-h) + env(safe-area-inset-bottom) + 10px)',
          left: 12,
          width: 40, height: 40, borderRadius: 12,
          background: isMoreActive ? 'var(--primary)' : 'var(--surface)',
          border: `1.5px solid ${isMoreActive ? 'var(--primary)' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isMoreActive ? 'white' : 'var(--text3)',
          boxShadow: 'var(--shadow)', cursor: 'pointer', zIndex: 150, transition: 'all 0.2s'
        }}
        className="more-btn-mobile"
        aria-label="আরো"
      >
        <MoreHorizontal size={18} />
      </button>

      {showMore && <MoreMenu onClose={() => setShowMore(false)} />}
    </div>
  )
}

/* ── Auth gate ── */
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
