'use client'
import { useAppStore, type ActiveSection } from '@/lib/app-store'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'
import { t } from '@/lib/i18n'
import {
  Home, Package, ScanLine, BookOpen, BarChart2,
  ArrowLeftRight, History, Settings, Shield,
  HelpCircle, Lock, FileText, AlertTriangle, LogOut, X
} from 'lucide-react'

interface Props { open: boolean; onClose: () => void }

export default function Sidebar({ open, onClose }: Props) {
  const { activeSection, setActiveSection, inventory, lang } = useAppStore()
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const av = user?.shop_name?.charAt(0).toUpperCase() || 'D'
  const lowStock = inventory.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock')

  // Fix #14: nav labels from i18n
  const NAV_MAIN = [
    { id: 'dashboard' as ActiveSection, icon: Home, label: t(lang, 'dashboard'), color: '#FF5722' },
    { id: 'inventory' as ActiveSection, icon: Package, label: t(lang, 'inventory'), color: '#2196F3' },
    { id: 'pos' as ActiveSection, icon: ScanLine, label: t(lang, 'pos'), color: '#00C853' },
    { id: 'dueledger' as ActiveSection, icon: BookOpen, label: t(lang, 'dueLedger'), color: '#FF9800' },
    { id: 'reports' as ActiveSection, icon: BarChart2, label: t(lang, 'reports'), color: '#9C27B0' },
  ]
  const NAV_MORE = [
    { id: 'transactions' as ActiveSection, icon: ArrowLeftRight, label: t(lang, 'transactions'), color: '#2196F3' },
    { id: 'txhistory' as ActiveSection, icon: History, label: t(lang, 'txHistory'), color: '#9C27B0' },
    { id: 'settings' as ActiveSection, icon: Settings, label: t(lang, 'settingsNav'), color: '#607D8B' },
    { id: 'security' as ActiveSection, icon: Shield, label: t(lang, 'security'), color: '#4CAF50' },
    { id: 'directions' as ActiveSection, icon: HelpCircle, label: t(lang, 'help'), color: '#FF9800' },
    { id: 'privacy' as ActiveSection, icon: Lock, label: t(lang, 'privacy'), color: '#607D8B' },
    { id: 'disclaimer' as ActiveSection, icon: AlertTriangle, label: t(lang, 'disclaimer'), color: '#F44336' },
    { id: 'terms' as ActiveSection, icon: FileText, label: t(lang, 'terms'), color: '#607D8B' },
  ]

  function go(id: ActiveSection) { setActiveSection(id); onClose() }

  async function doLogout() {
    await logout()
    toast(t(lang, 'signOut') + ' ✓', 'in')
    onClose()
  }

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`} aria-label="নেভিগেশন">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">📦</div>
            <div className="sidebar-brand">
              <span className="sidebar-brand-name">Digiboi</span>
              {user && <span className="sidebar-brand-shop">{user.shop_name}</span>}
            </div>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="বন্ধ করুন"><X size={18} /></button>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{av}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.shop_name}</div>
            <div className="sidebar-user-sub">{user?.owner_name} · {user?.phone}</div>
            {lowStock.length > 0 && <div className="sidebar-alert">⚠️ {lowStock.length} টি পণ্য কম</div>}
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">{t(lang, 'mainMenu')}</div>
          {NAV_MAIN.map(item => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button key={item.id} className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
                onClick={() => go(item.id)} style={{ '--item-color': item.color } as React.CSSProperties}>
                <div className="sidebar-item-icon"><Icon size={18} strokeWidth={isActive ? 2.5 : 2} /></div>
                <span className="sidebar-item-label">{item.label}</span>
                {isActive && <div className="sidebar-item-dot" />}
              </button>
            )
          })}

          <div className="sidebar-divider" />
          <div className="sidebar-nav-label">{lang === 'bn' ? 'আরো' : 'More'}</div>

          {NAV_MORE.map(item => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button key={item.id} className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
                onClick={() => go(item.id)} style={{ '--item-color': item.color } as React.CSSProperties}>
                <div className="sidebar-item-icon"><Icon size={17} strokeWidth={isActive ? 2.5 : 2} /></div>
                <span className="sidebar-item-label">{item.label}</span>
                {isActive && <div className="sidebar-item-dot" />}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={doLogout}>
            <LogOut size={16} />
            <span>{t(lang, 'signOut')}</span>
          </button>
          <div className="sidebar-version">v12.0 · Digiboi</div>
        </div>
      </aside>
    </>
  )
}
