'use client'
import { useAppStore, type ActiveSection } from '@/lib/app-store'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'
import {
  Home, Package, ScanLine, BookOpen, BarChart2,
  ArrowLeftRight, History, Settings, Shield,
  HelpCircle, Lock, FileText, AlertTriangle, LogOut, X
} from 'lucide-react'

const NAV_MAIN = [
  { id: 'dashboard' as ActiveSection, icon: Home, label: 'হোম', color: 'var(--brand-1)' },
  { id: 'inventory' as ActiveSection, icon: Package, label: 'পণ্য', color: '#2196F3' },
  { id: 'pos' as ActiveSection, icon: ScanLine, label: 'POS বিক্রয়', color: 'var(--success)' },
  { id: 'dueledger' as ActiveSection, icon: BookOpen, label: 'বকেয়া', color: 'var(--brand-2)' },
  { id: 'reports' as ActiveSection, icon: BarChart2, label: 'রিপোর্ট', color: 'var(--purple)' },
]

const NAV_MORE = [
  { id: 'transactions' as ActiveSection, icon: ArrowLeftRight, label: 'লেনদেন', color: '#2196F3' },
  { id: 'txhistory' as ActiveSection, icon: History, label: 'ইতিহাস', color: 'var(--purple)' },
  { id: 'settings' as ActiveSection, icon: Settings, label: 'সেটিংস', color: '#607D8B' },
  { id: 'security' as ActiveSection, icon: Shield, label: 'নিরাপত্তা', color: 'var(--success)' },
  { id: 'directions' as ActiveSection, icon: HelpCircle, label: 'সাহায্য', color: 'var(--brand-2)' },
  { id: 'privacy' as ActiveSection, icon: Lock, label: 'গোপনীয়তা', color: '#607D8B' },
  { id: 'disclaimer' as ActiveSection, icon: AlertTriangle, label: 'দাবিত্যাগ', color: 'var(--danger)' },
  { id: 'terms' as ActiveSection, icon: FileText, label: 'শর্তাবলী', color: '#607D8B' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: Props) {
  const { activeSection, setActiveSection, inventory } = useAppStore()
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const av = user?.shop_name?.charAt(0).toUpperCase() || 'D'
  const lowStock = inventory.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock')

  function go(id: ActiveSection) {
    setActiveSection(id)
    onClose()
  }

  async function doLogout() {
    await logout()
    toast('সাইন আউট সফল হয়েছে', 'in')
    onClose()
  }

  return (
    <>
      {/* Overlay (mobile only) */}
      {open && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`} aria-label="নেভিগেশন">
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">📦</div>
            <div className="sidebar-brand">
              <span className="sidebar-brand-name">Digiboi</span>
              {user && <span className="sidebar-brand-shop">{user.shop_name}</span>}
            </div>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="বন্ধ করুন">
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">{av}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.shop_name}</div>
            <div className="sidebar-user-sub">{user?.owner_name} · {user?.phone}</div>
            {lowStock.length > 0 && (
              <div className="sidebar-alert">⚠️ {lowStock.length} টি পণ্য কম</div>
            )}
          </div>
        </div>

        {/* Main nav */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">মূল মেনু</div>
          {NAV_MAIN.map(item => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
                onClick={() => go(item.id)}
                style={{ '--item-color': item.color } as React.CSSProperties}
              >
                <div className="sidebar-item-icon">
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="sidebar-item-label">{item.label}</span>
                {isActive && <div className="sidebar-item-dot" />}
              </button>
            )
          })}

          <div className="sidebar-divider" />
          <div className="sidebar-nav-label">আরো</div>

          {NAV_MORE.map(item => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
                onClick={() => go(item.id)}
                style={{ '--item-color': item.color } as React.CSSProperties}
              >
                <div className="sidebar-item-icon">
                  <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="sidebar-item-label">{item.label}</span>
                {isActive && <div className="sidebar-item-dot" />}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={doLogout}>
            <LogOut size={16} />
            <span>সাইন আউট</span>
          </button>
          <div className="sidebar-version">v12.0 · Digiboi</div>
        </div>
      </aside>
    </>
  )
}
