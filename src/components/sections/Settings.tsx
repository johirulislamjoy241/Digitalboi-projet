'use client'
import { useState } from 'react'
import { useAppStore } from '@/lib/app-store'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'
import { Sun, Moon, Globe, DollarSign, AlertTriangle, LogOut, ChevronRight } from 'lucide-react'

const CURRENCIES = ['BDT', 'USD', 'EUR', 'GBP', 'INR', 'SAR', 'AED']
const LANGS = [{ v: 'bn', l: '🇧🇩 বাংলা' }, { v: 'en', l: '🇺🇸 English' }]

export default function SettingsSection() {
  const { theme, setTheme, lang, setLang, currency, setCurrency, lowStockThreshold, setLowStockThreshold } = useAppStore()
  const { logout } = useAuth(); const { toast } = useToast()

  async function doLogout() { await logout(); toast('সাইন আউট হয়েছে', 'in') }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card card-p anim-fade-up">
        <div className="section-title" style={{ marginBottom: 16 }}>সেটিংস</div>

        {/* Theme */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,152,0,0.1)', color: '#FF9800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            </div>
            <div>
              <div className="section-title" style={{ fontSize: '0.85rem' }}>থিম</div>
              <div className="section-subtitle">{theme === 'dark' ? '🌙 ডার্ক মোড' : '☀️ লাইট মোড'}</div>
            </div>
          </div>
          <button className={`toggle ${theme === 'dark' ? 'on' : ''}`} onClick={() => { const n = theme === 'dark' ? 'light' : 'dark'; setTheme(n); toast(n === 'dark' ? '🌙 ডার্ক মোড চালু' : '☀️ লাইট মোড চালু', 'in') }} />
        </div>

        {/* Language */}
        <div className="input-group">
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Globe size={14} /> ভাষা</label>
          <select className="input" value={lang} onChange={e => { setLang(e.target.value as 'bn' | 'en'); toast('ভাষা পরিবর্তন হয়েছে', 'in') }}>
            {LANGS.map(l => <option key={l.v} value={l.v}>{l.l}</option>)}
          </select>
        </div>

        {/* Currency */}
        <div className="input-group">
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><DollarSign size={14} /> মুদ্রা</label>
          <select className="input" value={currency} onChange={e => { setCurrency(e.target.value); toast('মুদ্রা পরিবর্তন হয়েছে', 'in') }}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Low Stock Threshold */}
        <div className="input-group">
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={14} /> লো স্টক সীমা</label>
          <input className="input" type="number" value={lowStockThreshold} onChange={e => setLowStockThreshold(parseInt(e.target.value) || 10)} min="1" />
          <div style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: 4, fontFamily: 'var(--font-bn)' }}>
            এর নিচে গেলে "লো স্টক" সতর্কতা দেখাবে
          </div>
        </div>
      </div>

      {/* Logout */}
      <button className="btn btn-danger btn-full" onClick={doLogout} style={{ padding: 14 }}>
        <LogOut size={16} /> সাইন আউট করুন
      </button>

      <div style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)', paddingBottom: 8 }}>
        Digiboi POS v4.0 · সুরক্ষিত ক্লাউড ব্যবসা ব্যবস্থাপনা
      </div>
    </div>
  )
}
