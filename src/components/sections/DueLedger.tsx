'use client'
import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '@/lib/app-store'
import { useApi } from '@/lib/api'
import { useToast } from '@/lib/toast-context'
import { formatCurrency, formatDateShort, formatDate } from '@/lib/utils'
import type { DueLedgerEntry, Buyer, InventoryItem } from '@/types'
import { Search, Plus, User, Package, CreditCard, ChevronDown, Trash2, RefreshCw, Phone, MapPin, MessageSquare, X, ArrowRight } from 'lucide-react'

type DueTab = 'all' | 'pending' | 'partial' | 'overdue' | 'paid' | 'buyers'

/* ══ Issues 4,5: Sticky-footer sheet modal ══ */
function FormSheet({ title, onClose, onSave, saving, saveLabel, children }: {
  title: string; onClose: () => void; onSave: () => void
  saving: boolean; saveLabel: string; children: React.ReactNode
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: '24px 24px 0 0',
          width: '100%', maxWidth: 430,
          height: 'min(96dvh, 100%)',
          maxHeight: '96dvh',
          display: 'flex', flexDirection: 'column',
          animation: 'sheet-up 0.32s cubic-bezier(0.16,1,0.3,1)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px 12px', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
          <div className="modal-handle" style={{ marginBottom: 12 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="modal-title" style={{ marginBottom: 0 }}>{title}</div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4, fontSize: '1.1rem' }}>✕</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'scroll', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', padding: '16px 20px' }}>
          {children}
          <div style={{ height: 8 }} />
        </div>
        <div style={{ padding: '12px 20px', paddingBottom: 'max(16px,env(safe-area-inset-bottom))', borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>বাতিল</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={onSave} disabled={saving}>
              {saving ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span className="spin" style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />সংরক্ষণ...</span> : saveLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══ Issue 6: Buyer profile sheet — full transaction history ══ */
function BuyerProfileSheet({ buyer, dueLedger, onClose, fmt }: {
  buyer: Buyer; dueLedger: DueLedgerEntry[]; onClose: () => void; fmt: (v: number) => string
}) {
  const entries = dueLedger.filter(e => e.buyer_id === buyer.id || e.buyer_name === buyer.name)
  const totalTxn = entries.reduce((s, e) => s + e.total_amount, 0)
  const totalPaid = entries.reduce((s, e) => s + e.paid_amount, 0)
  const totalDue = entries.reduce((s, e) => s + e.remaining, 0)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: '24px 24px 0 0',
          width: '100%', maxWidth: 430,
          height: 'min(96dvh, 100%)',
          maxHeight: '96dvh',
          display: 'flex', flexDirection: 'column',
          animation: 'sheet-up 0.32s cubic-bezier(0.16,1,0.3,1)',
          overflow: 'hidden',
        }}
      >
        {/* Fixed header */}
        <div style={{ padding: '16px 20px 14px', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
          <div className="modal-handle" style={{ marginBottom: 12 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-bn)', color: 'var(--text)' }}>👤 ক্রেতার প্রোফাইল</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
          </div>
          {/* Buyer info card */}
          <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', borderRadius: 16, padding: '16px', marginBottom: 14, color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700, flexShrink: 0 }}>
                {buyer.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-bn)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{buyer.name}</div>
                {buyer.phone && <div style={{ fontSize: '0.78rem', opacity: 0.85, fontFamily: 'var(--font-bn)', display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={12} />{buyer.phone}</div>}
                {buyer.address && <div style={{ fontSize: '0.72rem', opacity: 0.75, fontFamily: 'var(--font-bn)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}><MapPin size={11} />{buyer.address}</div>}
                {buyer.email && <div style={{ fontSize: '0.68rem', opacity: 0.7, marginTop: 2 }}>{buyer.email}</div>}
              </div>
            </div>
          </div>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: buyer.notes ? 12 : 0 }}>
            {[
              { label: 'মোট লেনদেন', value: fmt(totalTxn), color: 'var(--info)', bg: 'var(--info-light)' },
              { label: 'পরিশোধিত', value: fmt(totalPaid), color: 'var(--success)', bg: 'var(--success-light)' },
              { label: 'বকেয়া', value: fmt(totalDue), color: totalDue > 0 ? 'var(--danger)' : 'var(--success)', bg: totalDue > 0 ? 'var(--danger-light)' : 'var(--success-light)' },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.76rem', color: s.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</div>
                <div style={{ fontSize: '0.56rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {buyer.notes && (
            <div style={{ display: 'flex', gap: 8, background: 'var(--surface2)', borderRadius: 10, padding: '8px 12px', marginTop: 12 }}>
              <MessageSquare size={13} color="var(--text3)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text2)', fontFamily: 'var(--font-bn)' }}>{buyer.notes}</span>
            </div>
          )}
        </div>

        {/* Scrollable transaction list */}
        <div style={{ flex: 1, overflowY: 'scroll', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', padding: '0 20px' }}>
          <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text)', fontFamily: 'var(--font-bn)', padding: '14px 0 8px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)' }}>
            📋 লেনদেনের ইতিহাস ({entries.length}টি)
          </div>
          {entries.length === 0
            ? <div className="empty-state" style={{ padding: '32px 0' }}><div className="empty-icon">📋</div><div className="empty-title">কোনো লেনদেন নেই</div></div>
            : entries.map(e => {
                const pct = Math.min(100, e.total_amount > 0 ? (e.paid_amount / e.total_amount) * 100 : 0)
                const isOverdue = (e.status === 'Pending' || e.status === 'Partial') && e.due_date && new Date(e.due_date) < new Date()
                return (
                  <div key={e.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.83rem', color: 'var(--text)', fontFamily: 'var(--font-bn)', marginBottom: 2 }}>{e.product_name || 'বিবিধ'}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>{e.quantity} {e.unit} × {fmt(e.unit_price)} = {fmt(e.total_amount)}</div>
                        <div style={{ fontSize: '0.62rem', color: isOverdue ? 'var(--danger)' : 'var(--text3)', fontFamily: 'var(--font-bn)', marginTop: 2 }}>
                          {formatDate(e.created_at)}{e.due_date && ` · শেষ: ${formatDateShort(e.due_date)}`}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.88rem', color: e.status === 'Paid' ? 'var(--success)' : 'var(--danger)' }}>{fmt(e.remaining)}</div>
                        <span className={`badge ${e.status === 'Paid' ? 'badge-success' : e.status === 'Partial' ? 'badge-warning' : 'badge-danger'}`} style={{ display: 'inline-block', marginTop: 3 }}>
                          {e.status === 'Paid' ? 'পরিশোধ' : e.status === 'Partial' ? 'আংশিক' : isOverdue ? '⚠ মেয়াদ' : 'বকেয়া'}
                        </span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--success)' : pct > 50 ? 'var(--warning)' : 'var(--danger)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: '0.62rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>
                      <span>পরিশোধ: {fmt(e.paid_amount)}</span><span>মোট: {fmt(e.total_amount)}</span>
                    </div>
                  </div>
                )
              })
          }
          <div style={{ height: 16 }} />
        </div>

        <div style={{ padding: '12px 20px', paddingBottom: 'max(16px,env(safe-area-inset-bottom))', borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
          <button className="btn btn-ghost btn-full" onClick={onClose}>বন্ধ করুন</button>
        </div>
      </div>
    </div>
  )
}

export default function DueLedgerSection() {
  const { dueLedger, setDueLedger, buyers, setBuyers, inventory, setInventory, currency } = useAppStore()
  const api = useApi()
  const { toast } = useToast()
  const [tab, setTab] = useState<DueTab>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'payment' | 'buyer' | null>(null)
  const [editEntry, setEditEntry] = useState<DueLedgerEntry | null>(null)
  const [saving, setSaving] = useState(false)
  const [profileBuyer, setProfileBuyer] = useState<Buyer | null>(null)

  const [selBuyer, setSelBuyer] = useState<Buyer | null>(null)
  const [buyerSearch, setBuyerSearch] = useState('')
  const [showBuyerDd, setShowBuyerDd] = useState(false)
  const [selProduct, setSelProduct] = useState<InventoryItem | null>(null)
  const [prodSearch, setProdSearch] = useState('')
  const [showProdDd, setShowProdDd] = useState(false)
  const [dueForm, setDueForm] = useState({ qty: '', unit: 'pcs', unitPrice: '', paidAmount: '0', dueDate: '', notes: '' })
  const [payAmount, setPayAmount] = useState('')
  const [buyerForm, setBuyerForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' })

  const fmt = (v: number) => formatCurrency(v, currency)

  async function load() {
    setLoading(true)
    const [entries, buyerList] = await Promise.all([api.getDueLedger(), api.getBuyers()])
    setDueLedger(entries); setBuyers(buyerList)
    if (inventory.length === 0) setInventory(await api.getInventory())
    setLoading(false)
  }
  useEffect(() => { load() }, []) // eslint-disable-line

  const summary = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0)
    let total = 0, overdue = 0, paid = 0
    dueLedger.forEach(e => {
      if (e.status !== 'Paid') { total += e.remaining; if (e.due_date && new Date(e.due_date) < today) overdue += e.remaining }
      else { paid += e.total_amount }
    })
    return { total, overdue, paid, count: dueLedger.filter(e => e.status !== 'Paid').length }
  }, [dueLedger])

  const displayEntries = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0)
    let r = dueLedger
    if (search) r = r.filter(e => e.buyer_name.toLowerCase().includes(search.toLowerCase()) || (e.product_name || '').toLowerCase().includes(search.toLowerCase()))
    if (tab === 'pending') r = r.filter(e => e.status === 'Pending' && (!e.due_date || new Date(e.due_date) >= today))
    else if (tab === 'partial') r = r.filter(e => e.status === 'Partial')
    else if (tab === 'overdue') r = r.filter(e => (e.status === 'Pending' || e.status === 'Partial') && e.due_date && new Date(e.due_date) < today)
    else if (tab === 'paid') r = r.filter(e => e.status === 'Paid')
    return r
  }, [dueLedger, tab, search])

  const filteredBuyers = useMemo(() => {
    if (!buyerSearch) return buyers.slice(0, 20)
    return buyers.filter(b => b.name.toLowerCase().includes(buyerSearch.toLowerCase()) || (b.phone || '').includes(buyerSearch))
  }, [buyers, buyerSearch])

  const filteredProds = useMemo(() => {
    if (!prodSearch) return inventory.filter(i => i.status !== 'Archived').slice(0, 20)
    return inventory.filter(i => i.status !== 'Archived' && i.name.toLowerCase().includes(prodSearch.toLowerCase()))
  }, [inventory, prodSearch])

  const calcTotal = (parseFloat(dueForm.qty) || 0) * (parseFloat(dueForm.unitPrice) || 0)
  const calcRemaining = calcTotal - (parseFloat(dueForm.paidAmount) || 0)

  async function addDue() {
    if (!selBuyer) return toast('ক্রেতা নির্বাচন করুন', 'er')
    if (!dueForm.unitPrice) return toast('একক মূল্য দিন', 'er')
    if (!dueForm.qty) return toast('পরিমাণ দিন', 'er')
    setSaving(true)
    try {
      const created = await api.addDueEntry({ buyer_id: selBuyer.id, buyer_name: selBuyer.name, product_id: selProduct?.id, product_name: selProduct?.name || 'বিবিধ', quantity: parseFloat(dueForm.qty), unit: dueForm.unit, unit_price: parseFloat(dueForm.unitPrice), total_amount: calcTotal, paid_amount: parseFloat(dueForm.paidAmount) || 0, due_date: dueForm.dueDate || undefined, notes: dueForm.notes })
      setDueLedger([created, ...dueLedger])
      toast('বকেয়া যোগ হয়েছে ✅', 'ok')
      setModal(null); setSelBuyer(null); setBuyerSearch(''); setSelProduct(null); setProdSearch('')
      setDueForm({ qty: '', unit: 'pcs', unitPrice: '', paidAmount: '0', dueDate: '', notes: '' })
    } catch (e: unknown) { toast((e as Error).message || 'সমস্যা হয়েছে', 'er') }
    setSaving(false)
  }

  async function doPayment() {
    if (!editEntry || !payAmount) return toast('পরিমাণ দিন', 'er')
    const newPaid = editEntry.paid_amount + (parseFloat(payAmount) || 0)
    if (newPaid > editEntry.total_amount) return toast('পরিমাণ বেশি হয়ে গেছে', 'er')
    setSaving(true)
    try {
      const updated = await api.updateDueEntry(editEntry.id, { paid_amount: newPaid })
      setDueLedger(dueLedger.map(e => e.id === editEntry.id ? { ...e, ...updated } : e))
      toast('পেমেন্ট সম্পন্ন ✅', 'ok'); setModal(null); setPayAmount('')
    } catch (e: unknown) { toast((e as Error).message || 'সমস্যা হয়েছে', 'er') }
    setSaving(false)
  }

  async function deleteDue(entry: DueLedgerEntry) {
    if (!confirm(`"${entry.buyer_name}" এর বকেয়া মুছবেন?`)) return
    try { await api.deleteDueEntry(entry.id); setDueLedger(dueLedger.filter(e => e.id !== entry.id)); toast('মুছে ফেলা হয়েছে', 'wa') }
    catch (e: unknown) { toast((e as Error).message || 'সমস্যা', 'er') }
  }

  async function addBuyer() {
    if (!buyerForm.name) return toast('নাম দিন', 'er')
    setSaving(true)
    try {
      const created = await api.addBuyer(buyerForm)
      setBuyers([created, ...buyers])
      toast('ক্রেতা যোগ হয়েছে ✅', 'ok')
      setModal(null); setBuyerForm({ name: '', phone: '', email: '', address: '', notes: '' })
    } catch (e: unknown) { toast((e as Error).message || 'সমস্যা', 'er') }
    setSaving(false)
  }

  const TABS = [
    { id: 'all', label: 'সব' }, { id: 'pending', label: 'বকেয়া' }, { id: 'partial', label: 'আংশিক' },
    { id: 'overdue', label: '⚠ মেয়াদ' }, { id: 'paid', label: '✅ পরিশোধ' }, { id: 'buyers', label: '👥 ক্রেতা' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {profileBuyer && <BuyerProfileSheet buyer={profileBuyer} dueLedger={dueLedger} onClose={() => setProfileBuyer(null)} fmt={fmt} />}

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'মোট বকেয়া', value: fmt(summary.total), color: summary.total > 0 ? 'var(--danger)' : 'var(--success)', bg: summary.total > 0 ? 'var(--danger-light)' : 'var(--success-light)' },
          { label: 'মেয়াদোত্তীর্ণ', value: fmt(summary.overdue), color: 'var(--warning)', bg: 'var(--warning-light)' },
          { label: 'মোট পরিশোধ', value: fmt(summary.paid), color: 'var(--success)', bg: 'var(--success-light)' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.78rem', color: s.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</div>
            <div style={{ fontSize: '0.56rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ overflowX: 'scroll', WebkitOverflowScrolling: 'touch', display: 'flex', gap: 6, paddingBottom: 2, scrollbarWidth: 'none' }}>
        {TABS.map(t => <button key={t.id} className={`chip ${tab === (t.id as DueTab) ? 'active' : ''}`} style={{ flexShrink: 0 }} onClick={() => setTab(t.id as DueTab)}>{t.label}</button>)}
      </div>

      {/* Issue 3 fix: Search + action buttons — proper responsive row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '9px 12px', flex: 1, minWidth: 0 }}>
          <Search size={14} color="var(--text3)" style={{ flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="নাম বা পণ্য খুঁজুন..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '0.85rem', fontFamily: 'var(--font-bn)', minWidth: 0 }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 0, flexShrink: 0 }}>✕</button>}
        </div>
        <button className="btn btn-primary btn-icon" onClick={() => setModal('add')} title="নতুন বকেয়া" style={{ width: 42, height: 42, flexShrink: 0 }}><Plus size={17} /></button>
        <button className="btn btn-ghost btn-icon" onClick={() => setModal('buyer')} title="নতুন ক্রেতা" style={{ width: 42, height: 42, flexShrink: 0 }}><User size={17} /></button>
        <button className="btn btn-ghost btn-icon" onClick={load} title="রিফ্রেশ" style={{ width: 42, height: 42, flexShrink: 0 }}><RefreshCw size={15} className={loading ? 'spin' : ''} /></button>
      </div>

      {/* Content */}
      {tab === 'buyers' ? (
        <div className="card">
          {buyers.length === 0
            ? <div className="empty-state"><div className="empty-icon">👥</div><div className="empty-title">কোনো ক্রেতা নেই</div><div className="empty-sub">+ বোতামে ক্লিক করুন</div></div>
            : buyers.map(b => (
                <button key={b.id} className="list-item" style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }} onClick={() => setProfileBuyer(b)}>
                  <div className="list-icon" style={{ background: 'var(--info-light)', color: 'var(--info)', fontWeight: 700, fontSize: '0.9rem' }}>{b.name.charAt(0).toUpperCase()}</div>
                  <div className="list-info">
                    <div className="list-title">{b.name}</div>
                    <div className="list-sub">{b.phone || 'ফোন নেই'}{b.address ? ' · ' + b.address : ''}</div>
                  </div>
                  <ArrowRight size={14} color="var(--text3)" />
                </button>
              ))
          }
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && [1,2,3].map(i => <div key={i} className="card card-p"><div className="skeleton" style={{ height: 14, marginBottom: 8, borderRadius: 6 }} /><div className="skeleton" style={{ height: 10, width: '60%', borderRadius: 6 }} /></div>)}
          {!loading && displayEntries.length === 0 && (
            <div className="card"><div className="empty-state"><div className="empty-icon">📒</div><div className="empty-title">কোনো বকেয়া নেই</div><div className="empty-sub">নতুন বকেয়া যোগ করুন</div></div></div>
          )}
          {!loading && displayEntries.map(entry => {
            const pct = Math.min(100, entry.total_amount > 0 ? (entry.paid_amount / entry.total_amount) * 100 : 0)
            const isOverdue = (entry.status === 'Pending' || entry.status === 'Partial') && entry.due_date && new Date(entry.due_date) < new Date()
            const cardClass = isOverdue ? 'overdue' : entry.status === 'Partial' ? 'partial' : entry.status === 'Paid' ? 'paid' : ''
            return (
              <div key={entry.id} className={`due-card ${cardClass} anim-fade-up`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', fontFamily: 'var(--font-bn)', marginBottom: 2 }}>{entry.buyer_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>{entry.product_name} · {entry.quantity} {entry.unit}</div>
                    {entry.due_date && <div style={{ fontSize: '0.68rem', color: isOverdue ? 'var(--danger)' : 'var(--text3)', marginTop: 2, fontFamily: 'var(--font-bn)' }}>{isOverdue ? '⚠ মেয়াদ: ' : '📅 '}{formatDateShort(entry.due_date)}</div>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', color: entry.status === 'Paid' ? 'var(--success)' : 'var(--danger)' }}>{fmt(entry.remaining)}</div>
                    <span className={`badge ${entry.status === 'Paid' ? 'badge-success' : entry.status === 'Partial' ? 'badge-warning' : 'badge-danger'}`} style={{ marginTop: 4, display: 'inline-block' }}>
                      {entry.status === 'Paid' ? 'পরিশোধ' : entry.status === 'Partial' ? 'আংশিক' : 'বকেয়া'}
                    </span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--success)' : pct > 50 ? 'var(--warning)' : 'var(--danger)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.65rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>
                  <span>পরিশোধ: {fmt(entry.paid_amount)}</span><span>মোট: {fmt(entry.total_amount)}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {entry.status !== 'Paid' && (
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => { setEditEntry(entry); setModal('payment') }}>
                      <CreditCard size={13} /> পেমেন্ট নিন
                    </button>
                  )}
                  <button className="btn btn-danger btn-xs" onClick={() => deleteDue(entry)} style={{ width: 34, padding: 0 }}><Trash2 size={13} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ADD DUE MODAL */}
      {modal === 'add' && (
        <FormSheet title="📝 নতুন বকেয়া যোগ" onClose={() => setModal(null)} onSave={addDue} saving={saving} saveLabel="✅ বকেয়া যোগ করুন">
          <div className="input-group">
            <label className="input-label">ক্রেতা নির্বাচন *</label>
            <div style={{ position: 'relative' }}>
              <div className="search-bar" style={{ marginBottom: 0 }}>
                <User size={13} color="var(--text3)" />
                <input value={buyerSearch} onChange={e => { setBuyerSearch(e.target.value); setSelBuyer(null); setShowBuyerDd(true) }} onFocus={() => setShowBuyerDd(true)} placeholder="ক্রেতার নাম লিখুন..." />
                <ChevronDown size={13} color="var(--text3)" />
              </div>
              {showBuyerDd && filteredBuyers.length > 0 && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowBuyerDd(false)} />
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', zIndex: 20, maxHeight: 180, overflowY: 'scroll', marginTop: 4 }}>
                    {filteredBuyers.map(b => (
                      <button key={b.id} onClick={() => { setSelBuyer(b); setBuyerSearch(b.name); setShowBuyerDd(false) }}
                        style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: '0.82rem', fontFamily: 'var(--font-bn)', color: 'var(--text)' }}>
                        {b.name} {b.phone && <span style={{ color: 'var(--text3)' }}>· {b.phone}</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {selBuyer && <div style={{ fontSize: '0.72rem', color: 'var(--success)', marginTop: 4, fontFamily: 'var(--font-bn)' }}>✅ {selBuyer.name} নির্বাচিত</div>}
          </div>

          <div className="input-group">
            <label className="input-label">পণ্য নির্বাচন (ঐচ্ছিক)</label>
            <div style={{ position: 'relative' }}>
              <div className="search-bar" style={{ marginBottom: 0 }}>
                <Package size={13} color="var(--text3)" />
                <input value={prodSearch} onChange={e => { setProdSearch(e.target.value); setSelProduct(null); setShowProdDd(true) }} onFocus={() => setShowProdDd(true)} placeholder="পণ্য খুঁজুন..." />
              </div>
              {showProdDd && filteredProds.length > 0 && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowProdDd(false)} />
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', zIndex: 20, maxHeight: 160, overflowY: 'scroll', marginTop: 4 }}>
                    {filteredProds.map(p => (
                      <button key={p.id} onClick={() => { setSelProduct(p); setProdSearch(p.name); setDueForm(f => ({ ...f, unitPrice: String(p.sell_price), unit: p.unit })); setShowProdDd(false) }}
                        style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: '0.82rem', fontFamily: 'var(--font-bn)', color: 'var(--text)' }}>
                        {p.name} <span style={{ color: 'var(--text3)' }}>· {fmt(p.sell_price)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">পরিমাণ *</label>
              <input className="input" type="number" placeholder="1" value={dueForm.qty} onChange={e => setDueForm(f => ({ ...f, qty: e.target.value }))} min="0" step="any" />
            </div>
            <div className="input-group">
              <label className="input-label">একক মূল্য *</label>
              <input className="input" type="number" placeholder="0.00" value={dueForm.unitPrice} onChange={e => setDueForm(f => ({ ...f, unitPrice: e.target.value }))} step="any" />
            </div>
          </div>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">অগ্রিম পরিশোধ</label>
              <input className="input" type="number" placeholder="0" value={dueForm.paidAmount} onChange={e => setDueForm(f => ({ ...f, paidAmount: e.target.value }))} min="0" />
            </div>
            <div className="input-group">
              <label className="input-label">শেষ তারিখ</label>
              <input className="input" type="date" value={dueForm.dueDate} onChange={e => setDueForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">নোট (ঐচ্ছিক)</label>
            <input className="input" placeholder="অতিরিক্ত তথ্য..." value={dueForm.notes} onChange={e => setDueForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          {calcTotal > 0 && (
            <div style={{ background: 'var(--primary-bg)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-bn)', color: 'var(--text2)' }}>মোট মূল্য</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(calcTotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-bn)', color: 'var(--text2)' }}>বকেয়া থাকবে</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--danger)' }}>{fmt(calcRemaining)}</span>
              </div>
            </div>
          )}
        </FormSheet>
      )}

      {/* PAYMENT MODAL */}
      {modal === 'payment' && editEntry && (
        <FormSheet title="💳 পেমেন্ট গ্রহণ" onClose={() => setModal(null)} onSave={doPayment} saving={saving} saveLabel="✅ পেমেন্ট নিশ্চিত করুন">
          <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '14px', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontFamily: 'var(--font-bn)', fontSize: '0.95rem', marginBottom: 8 }}>{editEntry.buyer_name}</div>
            {[['মোট', fmt(editEntry.total_amount), ''], ['পরিশোধিত', fmt(editEntry.paid_amount), 'var(--success)'], ['বকেয়া', fmt(editEntry.remaining), 'var(--danger)']].map(([k, v, c], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>{k}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: i === 2 ? 800 : 600, color: c || 'var(--text)', fontSize: i === 2 ? '1rem' : undefined }}>{v}</span>
              </div>
            ))}
            <div className="progress-bar" style={{ marginTop: 10 }}>
              <div className="progress-fill" style={{ width: `${Math.min(100, (editEntry.paid_amount / editEntry.total_amount) * 100)}%`, background: 'var(--success)' }} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">পেমেন্টের পরিমাণ *</label>
            <input className="input" type="number" placeholder={String(editEntry.remaining)} value={payAmount} onChange={e => setPayAmount(e.target.value)} autoFocus step="any" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPayAmount(String(editEntry.remaining))}>সম্পূর্ণ</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPayAmount(String(Math.round(editEntry.remaining / 2)))}>অর্ধেক</button>
          </div>
        </FormSheet>
      )}

      {/* ADD BUYER MODAL */}
      {modal === 'buyer' && (
        <FormSheet title="👤 নতুন ক্রেতা যোগ" onClose={() => setModal(null)} onSave={addBuyer} saving={saving} saveLabel="✅ ক্রেতা যোগ করুন">
          <div className="input-group">
            <label className="input-label">নাম *</label>
            <input className="input" placeholder="ক্রেতার নাম" value={buyerForm.name} onChange={e => setBuyerForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          </div>
          <div className="input-group">
            <label className="input-label">ফোন নম্বর</label>
            <input className="input" type="tel" placeholder="01XXXXXXXXX" value={buyerForm.phone} onChange={e => setBuyerForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="input-group">
            <label className="input-label">ঠিকানা</label>
            <input className="input" placeholder="ঠিকানা লিখুন" value={buyerForm.address} onChange={e => setBuyerForm(f => ({ ...f, address: e.target.value }))} />
          </div>
          <div className="input-group">
            <label className="input-label">ইমেইল (ঐচ্ছিক)</label>
            <input className="input" type="email" placeholder="example@email.com" value={buyerForm.email} onChange={e => setBuyerForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="input-group">
            <label className="input-label">নোট (ঐচ্ছিক)</label>
            <input className="input" placeholder="অতিরিক্ত তথ্য" value={buyerForm.notes} onChange={e => setBuyerForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </FormSheet>
      )}
    </div>
  )
}
