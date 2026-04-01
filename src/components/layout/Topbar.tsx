'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useAppStore } from '@/lib/app-store'
import { useToast } from '@/lib/toast-context'
import { Bell, Sun, Moon, Package, X, Menu, TrendingUp } from 'lucide-react'

interface Props { onMenuOpen: () => void }

export default function Topbar({ onMenuOpen }: Props) {
  const { user } = useAuth()
  const { theme, setTheme, inventory } = useAppStore()
  const { toast } = useToast()
  const [showNotif, setShowNotif] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const av = user?.shop_name?.charAt(0).toUpperCase() || 'D'
  const lowStock = inventory.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock')
  const hasNotif = lowStock.length > 0

  function toggleTheme() {
    const n = theme === 'light' ? 'dark' : 'light'
    setTheme(n)
    toast(n === 'dark' ? '🌙 ডার্ক মোড চালু' : '☀️ লাইট মোড চালু','in')
  }

  return (
    <>
      <header className="topbar">
        <button className="topbar-btn topbar-hamburger" onClick={onMenuOpen} aria-label="মেনু" style={{ marginRight: 2 }}>
          <Menu size={18} />
        </button>

        <div className="topbar-logo">
          <div className="topbar-logo-icon">📦</div>
          <div className="topbar-brand">
            <span className="topbar-brand-name">Digiboi</span>
            {user && <span className="topbar-brand-shop">{user.shop_name}</span>}
          </div>
        </div>

        <div className="topbar-actions">
          <button className="topbar-btn" onClick={toggleTheme} title="থিম">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="topbar-btn" onClick={() => { setShowNotif(v => !v); setShowProfile(false) }} aria-label="নোটিফিকেশন">
            <Bell size={16} />
            {hasNotif && <span className="notif-dot" />}
          </button>
          <div className="topbar-avatar" onClick={() => { setShowProfile(v => !v); setShowNotif(false) }} role="button" tabIndex={0}>{av}</div>
        </div>
      </header>

      {/* Notification Popup */}
      {showNotif && (
        <>
          <div onClick={() => setShowNotif(false)} style={{ position: 'fixed', inset: 0, zIndex: 590 }} />
          <div className="notif-popup">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)', fontFamily: 'var(--font-bn)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Bell size={14} style={{ color: 'var(--primary)' }} /> সতর্কতা
                {hasNotif && <span style={{ background: 'var(--danger)', color: 'white', fontSize: '0.6rem', fontWeight: 800, padding: '1px 6px', borderRadius: 99 }}>{lowStock.length}</span>}
              </span>
              <button onClick={() => setShowNotif(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
                <X size={15} />
              </button>
            </div>
            {lowStock.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontFamily: 'var(--font-bn)', fontSize: '0.82rem' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>✅</div>
                সব ঠিক আছে
              </div>
            ) : lowStock.slice(0, 8).map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: item.status === 'Out of Stock' ? 'var(--danger-light)' : 'var(--warning-light)',
                  color: item.status === 'Out of Stock' ? 'var(--danger)' : 'var(--warning)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><Package size={15} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-bn)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  <div style={{ fontSize: '0.67rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>{item.quantity} {item.unit} বাকি</div>
                </div>
                <span className={`badge ${item.status === 'Out of Stock' ? 'badge-danger' : 'badge-warning'}`}>{item.status === 'Out of Stock' ? 'শেষ' : 'কম'}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <div className="modal-handle" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="modal-title">👤 প্রোফাইল</span>
                <button onClick={() => setShowProfile(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <X size={17} />
                </button>
              </div>
            </div>
            <div className="modal-body">
              {/* Avatar row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '4px 0 18px', borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'linear-gradient(135deg,var(--primary),var(--primary-dark))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '1.3rem', fontWeight: 800,
                  boxShadow: 'var(--shadow-primary)', flexShrink: 0,
                }}>{av}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)', fontFamily: 'var(--font-bn)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.shop_name}</div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>{user?.owner_name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{user?.phone}</div>
                </div>
              </div>
              <div className="info-row"><span className="info-key">মোট পণ্য</span><span className="info-val">{inventory.length} টি</span></div>
              <div className="info-row"><span className="info-key">লো স্টক</span><span className="info-val" style={{ color: lowStock.length > 0 ? 'var(--danger)' : 'var(--success)' }}>{lowStock.length} টি</span></div>
              <div className="info-row"><span className="info-key">থিম</span><span className="info-val">{theme === 'dark' ? '🌙 ডার্ক' : '☀️ লাইট'}</span></div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
