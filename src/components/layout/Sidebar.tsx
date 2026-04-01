'use client'
import { useAppStore, type ActiveSection } from '@/lib/app-store'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'
import {
  Home, Package, ScanLine, BookOpen, BarChart2,
  ArrowLeftRight, History, Settings, Shield,
  HelpCircle, Lock, FileText, AlertTriangle, LogOut, X,
  Phone, Store
} from 'lucide-react'

const NAV_MAIN = [
  { id: 'dashboard' as ActiveSection, icon: Home, label: 'হোম', color: '#FF5722' },
  { id: 'inventory' as ActiveSection, icon: Package, label: 'পণ্য', color: '#2196F3' },
  { id: 'pos' as ActiveSection, icon: ScanLine, label: 'POS বিক্রয়', color: '#00C853' },
  { id: 'dueledger' as ActiveSection, icon: BookOpen, label: 'বকেয়া', color: '#FF9800' },
  { id: 'reports' as ActiveSection, icon: BarChart2, label: 'রিপোর্ট', color: '#9C27B0' },
]

const NAV_MORE = [
  { id: 'transactions' as ActiveSection, icon: ArrowLeftRight, label: 'লেনদেন', color: '#2196F3' },
  { id: 'txhistory' as ActiveSection, icon: History, label: 'ইতিহাস', color: '#9C27B0' },
  { id: 'settings' as ActiveSection, icon: Settings, label: 'সেটিংস', color: '#607D8B' },
  { id: 'security' as ActiveSection, icon: Shield, label: 'নিরাপত্তা', color: '#4CAF50' },
  { id: 'directions' as ActiveSection, icon: HelpCircle, label: 'সাহায্য', color: '#FF9800' },
  { id: 'privacy' as ActiveSection, icon: Lock, label: 'গোপনীয়তা', color: '#607D8B' },
  { id: 'disclaimer' as ActiveSection, icon: AlertTriangle, label: 'দাবিত্যাগ', color: '#F44336' },
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
      {/* Overlay */}
      {open && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`} aria-label="নেভিগেশন">

        {/* ── Header: শুধু close button + ছোট brand নাম ── */}
        <div className="sidebar-header">
          <div className="sidebar-logo" style={{ justifyContent: 'flex-start' }}>
            <div className="sidebar-brand">
              <span className="sidebar-brand-name">Digiboi</span>
              <span className="sidebar-brand-shop" style={{ fontSize: '0.62rem', opacity: 0.8 }}>ব্যবসা ব্যবস্থাপনা</span>
            </div>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="বন্ধ করুন"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── User Profile Section — প্রো UI ── */}
        <div className="sidebar-user">
          {/* Avatar */}
          <div className="sidebar-avatar">{av}</div>

          {/* Info */}
          <div className="sidebar-user-info">
            {/* দোকানের নাম */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              marginBottom: 1
            }}>
              <Store size={11} color="var(--primary)" strokeWidth={2.5} style={{ flexShrink: 0 }} />
              <div className="sidebar-user-name">{user?.shop_name || 'আপনার দোকান'}</div>
            </div>

            {/* মালিকের নাম */}
            {user?.owner_name && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                marginBottom: 1
              }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text3)' }}>👤</span>
                <div className="sidebar-user-sub">{user.owner_name}</div>
              </div>
            )}

            {/* ফোন নম্বর */}
            {user?.phone && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                marginBottom: 1
              }}>
                <Phone size={10} color="var(--text3)" strokeWidth={2} style={{ flexShrink: 0 }} />
                <div className="sidebar-user-sub">{user.phone}</div>
              </div>
            )}

            {/* Low stock warning */}
            {lowStock.length > 0 && (
              <div className="sidebar-alert">
                ⚠️ {lowStock.length} টি পণ্যের স্টক কম
              </div>
            )}
          </div>
        </div>

        {/* ── Navigation ── */}
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
              >
                <div
                  className="sidebar-item-icon"
                  style={isActive ? { background: `${item.color}20` } : {}}
                >
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.5 : 2}
                    color={isActive ? item.color : undefined}
                  />
                </div>
                <span className="sidebar-item-label">{item.label}</span>
                {isActive && (
                  <div
                    className="sidebar-item-dot"
                    style={{ background: item.color }}
                  />
                )}
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
              >
                <div
                  className="sidebar-item-icon"
                  style={isActive ? { background: `${item.color}20` } : {}}
                >
                  <Icon
                    size={17}
                    strokeWidth={isActive ? 2.5 : 2}
                    color={isActive ? item.color : undefined}
                  />
                </div>
                <span className="sidebar-item-label">{item.label}</span>
                {isActive && (
                  <div
                    className="sidebar-item-dot"
                    style={{ background: item.color }}
                  />
                )}
              </button>
            )
          })}
        </nav>

        {/* ── Footer ── */}
        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={doLogout}>
            <LogOut size={16} />
            <span>সাইন আউট</span>
          </button>
          <div className="sidebar-version">v12.0 · Digiboi POS</div>
        </div>

      </aside>
    </>
  )
}
