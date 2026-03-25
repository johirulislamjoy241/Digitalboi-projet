'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useAppStore } from '@/lib/app-store'
import { useToast } from '@/lib/toast-context'
import { Bell, Sun, Moon, Package } from 'lucide-react'

export default function Topbar() {
  const { user } = useAuth()
  const { theme, setTheme, inventory, lang } = useAppStore()
  const { toast } = useToast()
  const [showNotif, setShowNotif] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const av = user?.shop_name?.charAt(0).toUpperCase() || 'D'
  const lowStock = inventory.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock')
  const hasNotif = lowStock.length > 0

  function toggleTheme() {
    const n = theme === 'light' ? 'dark' : 'light'
    setTheme(n)
    toast(n === 'dark' ? '🌙 ডার্ক মোড চালু' : '☀️ লাইট মোড চালু', 'in')
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-logo">
          <div className="topbar-logo-icon">📦</div>
          <div className="topbar-brand">
            <span className="topbar-brand-name">Digiboi</span>
            {user && <span className="topbar-brand-shop">{user.shop_name}</span>}
          </div>
        </div>
        <div className="topbar-actions">
          <button className="topbar-btn" onClick={toggleTheme} title="থিম পরিবর্তন">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="topbar-btn" onClick={() => setShowNotif(v => !v)}>
            <Bell size={16} />
            {hasNotif && <span className="notif-dot" />}
          </button>
          <div className="topbar-avatar" onClick={() => setShowProfile(v => !v)}>{av}</div>
        </div>
      </header>

      {/* Notification Panel */}
      {showNotif && (
        <>
          <div onClick={() => setShowNotif(false)} style={{ position: 'fixed', inset: 0, zIndex: 250, background: 'transparent' }} />
          <div style={{
            position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)',
            width: 'calc(100% - 32px)', maxWidth: 398, background: 'var(--surface)',
            borderRadius: 16, boxShadow: 'var(--shadow-lg)', zIndex: 300, padding: 16,
            border: '1px solid var(--border)', animation: 'fade-up 0.25s ease both'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="section-title">🔔 সতর্কতা</span>
              <button className="btn btn-ghost btn-xs" onClick={() => setShowNotif(false)}>✕</button>
            </div>
            {lowStock.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text3)', fontFamily: 'var(--font-bn)', fontSize: '0.82rem' }}>✅ সব ঠিক আছে</div>
            ) : lowStock.slice(0, 6).map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: item.status === 'Out of Stock' ? 'var(--danger-light)' : 'var(--warning-light)', color: item.status === 'Out of Stock' ? 'var(--danger)' : 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Package size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-bn)' }}>{item.name}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>{item.quantity} {item.unit} বাকি</div>
                </div>
                <span className={`badge ${item.status === 'Out of Stock' ? 'badge-danger' : 'badge-warning'}`}>
                  {item.status === 'Out of Stock' ? 'শেষ' : 'কম'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Profile Sheet */}
      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.3rem', fontWeight: 700, boxShadow: 'var(--shadow-primary)' }}>{av}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', fontFamily: 'var(--font-bn)' }}>{user?.shop_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>{user?.owner_name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: 2 }}>{user?.phone}</div>
              </div>
            </div>
            <div className="info-row"><span className="info-key">মোট পণ্য</span><span className="info-val">{inventory.length} টি</span></div>
            <div className="info-row"><span className="info-key">লো স্টক</span><span className="info-val" style={{ color: lowStock.length > 0 ? 'var(--danger)' : 'var(--success)' }}>{lowStock.length} টি</span></div>
            <div className="info-row"><span className="info-key">থিম</span><span className="info-val">{theme === 'dark' ? '🌙 ডার্ক' : '☀️ লাইট'}</span></div>
          </div>
        </div>
      )}
    </>
  )
}
