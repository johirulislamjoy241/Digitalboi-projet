'use client'
import { useAppStore, type ActiveSection } from '@/lib/app-store'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'
import { ArrowLeftRight, History, Settings, Shield, HelpCircle, Lock, FileText, AlertTriangle, LogOut, X } from 'lucide-react'

interface Props { onClose: () => void }

const MENU_ITEMS = [
  { id: 'transactions', icon: ArrowLeftRight, label: 'লেনদেন', color: '#2196F3', bg: 'var(--info-light)' },
  { id: 'txhistory', icon: History, label: 'ইতিহাস', color: '#9C27B0', bg: 'rgba(156,39,176,0.1)' },
  { id: 'settings', icon: Settings, label: 'সেটিংস', color: '#607D8B', bg: 'rgba(96,125,139,0.1)' },
  { id: 'security', icon: Shield, label: 'নিরাপত্তা', color: '#4CAF50', bg: 'var(--success-light)' },
  { id: 'directions', icon: HelpCircle, label: 'সাহায্য', color: '#FF9800', bg: 'rgba(255,152,0,0.1)' },
  { id: 'privacy', icon: Lock, label: 'গোপনীয়তা', color: '#607D8B', bg: 'rgba(96,125,139,0.1)' },
  { id: 'disclaimer', icon: AlertTriangle, label: 'দাবিত্যাগ', color: '#F44336', bg: 'var(--danger-light)' },
  { id: 'terms', icon: FileText, label: 'শর্তাবলী', color: '#607D8B', bg: 'rgba(96,125,139,0.1)' },
]

export default function MoreMenu({ onClose }: Props) {
  const { setActiveSection } = useAppStore()
  const { logout } = useAuth()
  const { toast } = useToast()

  function go(id: string) {
    setActiveSection(id as ActiveSection)
    onClose()
  }

  async function doLogout() {
    await logout()
    toast('সাইন আউট সফল হয়েছে', 'in')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* Use modal-sm for short content — it's auto-height, no body collapse issue */}
      <div className="modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        {/* Title row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span className="modal-title">⚙️ আরো বিকল্প</span>
          <button className="btn btn-ghost btn-xs" onClick={onClose} style={{ padding: '5px 8px' }}>
            <X size={15} />
          </button>
        </div>

        {/* 2-column grid of menu items */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {MENU_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: '14px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 11,
                  background: item.bg, color: item.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon size={18} />
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-bn)' }}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>

        <div className="divider" />

        <button className="btn btn-danger btn-full" onClick={doLogout} style={{ marginTop: 12 }}>
          <LogOut size={16} /> সাইন আউট
        </button>
      </div>
    </div>
  )
}
