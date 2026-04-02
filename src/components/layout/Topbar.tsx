'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useAppStore } from '@/lib/app-store'
import { useToast } from '@/lib/toast-context'
import { Bell, Sun, Moon, Package, X, Menu, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react'

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
    toast(n === 'dark' ? '🌙 ডার্ক মোড চালু' : '☀️ লাইট মোড চালু', 'in')
  }

  return (
    <>
      <header className="topbar">
        <button className="topbar-btn topbar-hamburger" onClick={onMenuOpen} aria-label="মেনু" style={{ marginRight: 2 }}>
          <Menu size={18} />
        </button>

        <div className="topbar-logo">
          <div className="topbar-logo-icon">
            <Sparkles size={18} color="white" />
          </div>
          <div className="topbar-brand">
            <span className="topbar-brand-name">Digiboi</span>
            {user && <span className="topbar-brand-shop">{user.shop_name}</span>}
          </div>
        </div>

        <div className="topbar-actions">
          <button className="topbar-btn" onClick={toggleTheme} title="থিম পরিবর্তন">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            className="topbar-btn"
            onClick={() => { setShowNotif(v => !v); setShowProfile(false) }}
            aria-label="সতর্কতা"
          >
            <Bell size={16} />
            {hasNotif && <span className="notif-dot" />}
          </button>
          <div
            className="topbar-avatar"
            onClick={() => { setShowProfile(v => !v); setShowNotif(false) }}
            role="button"
            tabIndex={0}
            aria-label="প্রোফাইল"
          >
            {av}
          </div>
        </div>
      </header>

      {/* ── Notification Panel ── */}
      {showNotif && (
        <>
          <div onClick={() => setShowNotif(false)} style={{ position:'fixed',inset:0,zIndex:590,background:'transparent' }} />
          <div className="notif-popup">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:32, height:32, borderRadius:9, background:'var(--warning-l)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Bell size={15} color="var(--warning)" />
                </div>
                <span style={{ fontWeight:800, fontSize:'0.9rem', color:'var(--text)', fontFamily:'var(--font-bn)' }}>সতর্কতা</span>
                {hasNotif && <span className="badge badge-warning">{lowStock.length}</span>}
              </div>
              <button onClick={() => setShowNotif(false)} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', padding:6, borderRadius:8, display:'flex', alignItems:'center' }}>
                <X size={16} />
              </button>
            </div>

            {lowStock.length === 0 ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, padding:'20px 0', color:'var(--text3)' }}>
                <CheckCircle2 size={32} color="var(--success)" />
                <span style={{ fontFamily:'var(--font-bn)', fontSize:'0.83rem', color:'var(--success)', fontWeight:600 }}>সব ঠিক আছে!</span>
              </div>
            ) : lowStock.map(item => (
              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{
                  width:40, height:40, borderRadius:12, flexShrink:0,
                  background: item.status === 'Out of Stock' ? 'var(--danger-l)' : 'var(--warning-l)',
                  color: item.status === 'Out of Stock' ? 'var(--danger)' : 'var(--warning)',
                  display:'flex', alignItems:'center', justifyContent:'center'
                }}>
                  {item.status === 'Out of Stock' ? <AlertTriangle size={16} /> : <Package size={16} />}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'0.83rem', fontWeight:700, color:'var(--text)', fontFamily:'var(--font-bn)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
                  <div style={{ fontSize:'0.68rem', color:'var(--text3)', fontFamily:'var(--font-bn)', marginTop:1 }}>{item.quantity} {item.unit} বাকি</div>
                </div>
                <span className={`badge ${item.status === 'Out of Stock' ? 'badge-danger' : 'badge-warning'}`}>
                  {item.status === 'Out of Stock' ? 'শেষ' : 'কম'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Profile Modal ── */}
      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-handle" />
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span className="modal-title">প্রোফাইল</span>
                <button onClick={() => setShowProfile(false)} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', padding:4, borderRadius:8, display:'flex', alignItems:'center' }}>
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="modal-body">
              {/* Avatar block */}
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20, padding:'16px', background:'var(--surface2)', borderRadius:16, border:'1px solid var(--border)' }}>
                <div style={{ width:56, height:56, borderRadius:17, background:'var(--bgrad)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'1.4rem', fontWeight:900, boxShadow:'var(--sh-brand)', flexShrink:0 }}>{av}</div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontWeight:800, fontSize:'1rem', color:'var(--text)', fontFamily:'var(--font-bn)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.shop_name}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text3)', fontFamily:'var(--font-bn)', marginTop:2 }}>{user?.owner_name}</div>
                  <div style={{ fontSize:'0.7rem', color:'var(--br1)', marginTop:3, fontFamily:'var(--font-mono)', fontWeight:600 }}>{user?.phone}</div>
                </div>
              </div>
              <div className="info-row"><span className="info-key">মোট পণ্য</span><span className="info-val">{inventory.length} টি</span></div>
              <div className="info-row"><span className="info-key">লো স্টক</span><span className="info-val" style={{ color: lowStock.length > 0 ? 'var(--danger)' : 'var(--success)' }}>{lowStock.length} টি</span></div>
              <div className="info-row"><span className="info-key">থিম</span><span className="info-val">{theme === 'dark' ? '🌙 ডার্ক' : '☀️ লাইট'}</span></div>
              <div className="info-row"><span className="info-key">ভার্সন</span><span className="info-val mono" style={{ fontSize:'0.75rem' }}>v13.0 Premium</span></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-full" onClick={() => setShowProfile(false)}>বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
