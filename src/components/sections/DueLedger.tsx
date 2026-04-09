'use client'
import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '@/lib/app-store'
import { useApi } from '@/lib/api'
import { useToast } from '@/lib/toast-context'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import type { DueLedgerEntry, Buyer, InventoryItem } from '@/types'
import {
  Search, Plus, BookOpen, User, Package, CreditCard,
  ChevronDown, Trash2, RefreshCw, X, Phone, MapPin,
  FileText, TrendingUp, Clock
} from 'lucide-react'

type DueTab = 'all' | 'pending' | 'partial' | 'overdue' | 'paid' | 'buyers'

/* ══ BUYER PROFILE SHEET ══ */
function BuyerProfile({
  buyer, dues, fmt, onClose
}: {
  buyer: Buyer
  dues: DueLedgerEntry[]
  fmt: (v: number) => string
  onClose: () => void
}) {
  const bd = dues.filter(e => e.buyer_id === buyer.id || e.buyer_name === buyer.name)
  const totalDue = bd.filter(e => e.status !== 'Paid').reduce((s, e) => s + e.remaining, 0)
  const totalPaid = bd.reduce((s, e) => s + e.paid_amount, 0)
  const totalAmt = bd.reduce((s, e) => s + e.total_amount, 0)
  const pendingCount = bd.filter(e => e.status !== 'Paid').length

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-handle" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--info-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>👤</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', fontFamily: 'var(--font-bn)' }}>{buyer.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>ক্রেতার প্রোফাইল</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4 }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Contact info */}
          <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: 12, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {buyer.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={13} color="var(--info)" />
                <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontFamily: 'var(--font-bn)' }}>{buyer.phone}</span>
              </div>
            )}
            {buyer.address && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <MapPin size={13} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontFamily: 'var(--font-bn)' }}>{buyer.address}</span>
              </div>
            )}
            {buyer.notes && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <FileText size={13} color="var(--text3)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text2)', fontFamily: 'var(--font-bn)' }}>{buyer.notes}</span>
              </div>
            )}
            {!buyer.phone && !buyer.address && !buyer.notes && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)', textAlign: 'center' }}>কোনো অতিরিক্ত তথ্য নেই</div>
            )}
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div style={{ background: 'var(--danger-light)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--danger)' }}>{fmt(totalDue)}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)', marginTop: 2 }}>মোট বকেয়া ({pendingCount}টি)</div>
            </div>
            <div style={{ background: 'var(--success-light)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--success)' }}>{fmt(totalPaid)}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)', marginTop: 2 }}>মোট পরিশোধ</div>
            </div>
            <div style={{ background: 'var(--primary-bg)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary)' }}>{fmt(totalAmt)}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)', marginTop: 2 }}>মোট লেনদেন</div>
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)' }}>{bd.length}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)', marginTop: 2 }}>মোট রেকর্ড</div>
            </div>
          </div>

          {/* History */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <TrendingUp size={14} color="var(--primary)" />
            <span style={{ fontWeight: 700, fontSize: '0.88rem', fontFamily: 'var(--font-bn)', color: 'var(--text)' }}>লেনদেনের ইতিহাস</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>({bd.length} টি)</span>
          </div>

          {bd.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0', fontSize: '0.78rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>
              কোনো লেনদেন নেই
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bd.map(e => {
                const pct = Math.min(100, e.total_amount > 0 ? (e.paid_amount / e.total_amount) * 100 : 0)
                const ov = (e.status === 'Pending' || e.status === 'Partial') && e.due_date && new Date(e.due_date) < new Date()
                return (
                  <div key={e.id} style={{ background: 'var(--surface2)', borderRadius: 11, padding: '10px 12px', borderLeft: `3px solid ${ov ? 'var(--danger)' : e.status === 'Paid' ? 'var(--success)' : e.status === 'Partial' ? 'var(--warning)' : 'var(--border)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text)', fontFamily: 'var(--font-bn)' }}>{e.product_name || 'বিবিধ'}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>{e.quantity} {e.unit} × {fmt(e.unit_price)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Clock size={9} color="var(--text3)" />
                          <span style={{ fontSize: '0.62rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>
                            {formatDateShort(e.created_at)}{e.due_date && ` · মেয়াদ: ${formatDateShort(e.due_date)}`}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: e.status === 'Paid' ? 'var(--success)' : 'var(--danger)' }}>{fmt(e.remaining)}</div>
                        <span className={`badge ${e.status === 'Paid' ? 'badge-success' : e.status === 'Partial' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.58rem' }}>
                          {e.status === 'Paid' ? 'পরিশোধ' : e.status === 'Partial' ? 'আংশিক' : 'বকেয়া'}
                        </span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--success)' : pct > 50 ? 'var(--warning)' : 'var(--danger)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: '0.6rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>
                      <span>পরিশোধ: {fmt(e.paid_amount)}</span>
                      <span>মোট: {fmt(e.total_amount)}</span>
                    </div>
                    {e.notes && <div style={{ marginTop: 3, fontSize: '0.62rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>💬 {e.notes}</div>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-ghost btn-full" onClick={onClose}>বন্ধ করুন</button>
        </div>
      </div>
    </div>
  )
}

/* ══ MAIN SECTION ══ */
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
  const [showBDD, setShowBDD] = useState(false)
  const [selProd, setSelProd] = useState<InventoryItem | null>(null)
  const [prodSearch, setProdSearch] = useState('')
  const [showPDD, setShowPDD] = useState(false)
  const [dueQty, setDueQty] = useState('')
  const [dueUnit, setDueUnit] = useState('pcs')
  const [duePrice, setDuePrice] = useState('')
  const [duePaid, setDuePaid] = useState('0')
  const [dueDate, setDueDate] = useState('')
  const [dueNotes, setDueNotes] = useState('')
  const [payAmt, setPayAmt] = useState('')
  const [bName, setBName] = useState('')
  const [bPhone, setBPhone] = useState('')
  const [bEmail, setBEmail] = useState('')
  const [bAddr, setBAddr] = useState('')
  const [bNotes, setBNotes] = useState('')

  const fmt = (v: number) => formatCurrency(v, currency)

  async function load() {
    setLoading(true)
    const [entries, bl] = await Promise.all([api.getDueLedger(), api.getBuyers()])
    setDueLedger(entries)
    setBuyers(bl)
    if (inventory.length === 0) setInventory(await api.getInventory())
    setLoading(false)
  }
  useEffect(() => { load() }, []) // eslint-disable-line

  const summary = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    let total = 0, overdue = 0
    dueLedger.forEach(e => {
      if (e.status !== 'Paid') {
        total += e.remaining
        if (e.due_date && new Date(e.due_date) < today) overdue += e.remaining
      }
    })
    return { total, overdue, count: dueLedger.filter(e => e.status !== 'Paid').length }
  }, [dueLedger])

  const displayEntries = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    let r = dueLedger
    if (search) r = r.filter(e =>
      e.buyer_name.toLowerCase().includes(search.toLowerCase()) ||
      (e.product_name || '').toLowerCase().includes(search.toLowerCase())
    )
    if (tab === 'pending') r = r.filter(e => e.status === 'Pending' && (!e.due_date || new Date(e.due_date) >= today))
    else if (tab === 'partial') r = r.filter(e => e.status === 'Partial')
    else if (tab === 'overdue') r = r.filter(e => (e.status === 'Pending' || e.status === 'Partial') && e.due_date && new Date(e.due_date) < today)
    else if (tab === 'paid') r = r.filter(e => e.status === 'Paid')
    return r
  }, [dueLedger, tab, search])

  const fBuyers = useMemo(() => {
    if (!buyerSearch) return buyers.slice(0, 20)
    return buyers.filter(b => b.name.toLowerCase().includes(buyerSearch.toLowerCase()) || (b.phone || '').includes(buyerSearch))
  }, [buyers, buyerSearch])

  const fProds = useMemo(() => {
    if (!prodSearch) return inventory.filter(i => i.status !== 'Archived').slice(0, 20)
    return inventory.filter(i => i.status !== 'Archived' && i.name.toLowerCase().includes(prodSearch.toLowerCase()))
  }, [inventory, prodSearch])

  const calcTotal = (parseFloat(dueQty) || 0) * (parseFloat(duePrice) || 0)
  const calcRem = calcTotal - (parseFloat(duePaid) || 0)

  function resetDueForm() {
    setSelBuyer(null); setBuyerSearch('')
    setSelProd(null); setProdSearch('')
    setDueQty(''); setDueUnit('pcs'); setDuePrice('')
    setDuePaid('0'); setDueDate(''); setDueNotes('')
  }

  async function addDue() {
    if (!selBuyer) return toast('ক্রেতা নির্বাচন করুন', 'er')
    if (!duePrice) return toast('একক মূল্য দিন', 'er')
    if (!dueQty) return toast('পরিমাণ দিন', 'er')
    setSaving(true)
    try {
      const created = await api.addDueEntry({
        buyer_id: selBuyer.id, buyer_name: selBuyer.name,
        product_id: selProd?.id, product_name: selProd?.name || 'বিবিধ',
        quantity: parseFloat(dueQty), unit: dueUnit,
        unit_price: parseFloat(duePrice), total_amount: calcTotal,
        paid_amount: parseFloat(duePaid) || 0,
        due_date: dueDate || undefined, notes: dueNotes
      })
      setDueLedger([created, ...dueLedger])
      toast('বকেয়া যোগ হয়েছে ✅', 'ok')
      setModal(null); resetDueForm()
    } catch (e: unknown) { toast((e as Error).message || 'সমস্যা', 'er') }
    setSaving(false)
  }

  async function doPayment() {
    if (!editEntry || !payAmt) return toast('পরিমাণ দিন', 'er')
    const newPaid = editEntry.paid_amount + (parseFloat(payAmt) || 0)
    if (newPaid > editEntry.total_amount) return toast('পরিমাণ বেশি', 'er')
    setSaving(true)
    try {
      const u = await api.updateDueEntry(editEntry.id, { paid_amount: newPaid })
      setDueLedger(dueLedger.map(e => e.id === editEntry.id ? { ...e, ...u } : e))
      toast('পেমেন্ট সম্পন্ন ✅', 'ok'); setModal(null); setPayAmt('')
    } catch (e: unknown) { toast((e as Error).message || 'সমস্যা', 'er') }
    setSaving(false)
  }

  async function addBuyer() {
    if (!bName) return toast('নাম দিন', 'er')
    setSaving(true)
    try {
      const created = await api.addBuyer({ name: bName, phone: bPhone, email: bEmail, address: bAddr, notes: bNotes })
      setBuyers([created, ...buyers])
      toast('ক্রেতা যোগ হয়েছে ✅', 'ok')
      setModal(null)
      setBName(''); setBPhone(''); setBEmail(''); setBAddr(''); setBNotes('')
    } catch (e: unknown) { toast((e as Error).message || 'সমস্যা', 'er') }
    setSaving(false)
  }

  async function delDue(entry: DueLedgerEntry) {
    if (!confirm(`"${entry.buyer_name}" এর বকেয়া মুছবেন?`)) return
    try {
      await api.deleteDueEntry(entry.id)
      setDueLedger(dueLedger.filter(e => e.id !== entry.id))
      toast('মুছে ফেলা হয়েছে', 'wa')
    } catch (e: unknown) { toast((e as Error).message || 'সমস্যা', 'er') }
  }

  const TABS: [DueTab, string][] = [
    ['all', 'সব'], ['pending', 'বকেয়া'], ['partial', 'আংশিক'],
    ['overdue', '⚠ মেয়াদ'], ['paid', '✅ পরিশোধ'], ['buyers', '👥 ক্রেতা']
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Summary cards */}
      <div className="kpi-grid anim-fade-up">
        <div className="kpi-card" style={{ '--kpi-color': 'var(--danger)' } as React.CSSProperties}>
          <div className="kpi-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}><BookOpen size={18} /></div>
          <div className="kpi-value">{fmt(summary.total)}</div>
          <div className="kpi-label">মোট বকেয়া ({summary.count} জন)</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-color': 'var(--warning)' } as React.CSSProperties}>
          <div className="kpi-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}><CreditCard size={18} /></div>
          <div className="kpi-value">{fmt(summary.overdue)}</div>
          <div className="kpi-label">মেয়াদ উত্তীর্ণ</div>
        </div>
      </div>

      {/* Tab + Search + Action buttons */}
      <div className="card card-p anim-fade-up anim-d1">
        {/* Tabs scroll row */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, marginBottom: 10, scrollbarWidth: 'none' }}>
          {TABS.map(([id, label]) => (
            <button key={id} className={`chip ${tab === id ? 'active' : ''}`} style={{ flexShrink: 0 }} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
        {/* Search + buttons row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 7, background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '0 10px', height: 42 }}>
            <Search size={14} color="var(--text3)" style={{ flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="নাম বা পণ্য খুঁজুন..."
              style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '0.82rem', fontFamily: 'var(--font-bn)' }}
            />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 0, flexShrink: 0 }}>✕</button>}
          </div>
          <button className="btn btn-primary btn-icon" onClick={() => setModal('add')} title="নতুন বকেয়া" style={{ width: 42, height: 42, flexShrink: 0 }}><Plus size={18} /></button>
          <button className="btn btn-ghost btn-icon" onClick={() => setModal('buyer')} title="নতুন ক্রেতা" style={{ width: 42, height: 42, flexShrink: 0 }}><User size={16} /></button>
          <button className="btn btn-ghost btn-icon" onClick={load} style={{ width: 42, height: 42, flexShrink: 0 }}><RefreshCw size={15} className={loading ? 'spin' : ''} /></button>
        </div>
      </div>

      {/* Buyers tab */}
      {tab === 'buyers' ? (
        <div className="card anim-fade-up anim-d2">
          {buyers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <div className="empty-title">কোনো ক্রেতা নেই</div>
              <div className="empty-sub">উপরের বোতামে ক্লিক করে ক্রেতা যোগ করুন</div>
            </div>
          ) : (
            buyers.map(b => (
              <div key={b.id} className="list-item" onClick={() => setProfileBuyer(b)}>
                <div className="list-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}><User size={16} /></div>
                <div className="list-info">
                  <div className="list-title">{b.name}</div>
                  <div className="list-sub">{b.phone || 'ফোন নেই'}{b.address ? ' · ' + b.address : ''}</div>
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--primary)', fontFamily: 'var(--font-bn)', flexShrink: 0 }}>প্রোফাইল →</div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Due entries list */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && [1, 2, 3].map(i => (
            <div key={i} className="card card-p">
              <div className="skeleton" style={{ height: 14, marginBottom: 8, borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 10, width: '60%', borderRadius: 6 }} />
            </div>
          ))}
          {!loading && displayEntries.length === 0 && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">📒</div>
                <div className="empty-title">কোনো বকেয়া নেই</div>
                <div className="empty-sub">+ বোতামে ক্লিক করুন</div>
              </div>
            </div>
          )}
          {!loading && displayEntries.map(entry => {
            const pct = Math.min(100, entry.total_amount > 0 ? (entry.paid_amount / entry.total_amount) * 100 : 0)
            const ov = (entry.status === 'Pending' || entry.status === 'Partial') && entry.due_date && new Date(entry.due_date) < new Date()
            const cls = ov ? 'overdue' : entry.status === 'Partial' ? 'partial' : entry.status === 'Paid' ? 'paid' : ''
            return (
              <div key={entry.id} className={`due-card ${cls} anim-fade-up`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', fontFamily: 'var(--font-bn)', marginBottom: 2 }}>{entry.buyer_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>{entry.product_name} · {entry.quantity} {entry.unit}</div>
                    {entry.due_date && (
                      <div style={{ fontSize: '0.68rem', color: ov ? 'var(--danger)' : 'var(--text3)', marginTop: 2, fontFamily: 'var(--font-bn)' }}>
                        {ov ? '⚠ মেয়াদ শেষ: ' : '📅 '}{formatDateShort(entry.due_date)}
                      </div>
                    )}
                    {entry.notes && <div style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: 2, fontFamily: 'var(--font-bn)' }}>💬 {entry.notes}</div>}
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
                  <span>পরিশোধ: {fmt(entry.paid_amount)}</span>
                  <span>মোট: {fmt(entry.total_amount)}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {entry.status !== 'Paid' && (
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => { setEditEntry(entry); setModal('payment') }}>
                      <CreditCard size={14} /> পেমেন্ট নিন
                    </button>
                  )}
                  <button className="btn btn-danger btn-xs" onClick={() => delDue(entry)} style={{ width: 34, padding: 0 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ══ ADD DUE MODAL ══ */}
      {modal === 'add' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-handle" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="modal-title">📝 নতুন বকেয়া যোগ</span>
                <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4 }}>
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="modal-body">
              {/* Buyer select */}
              <div className="input-group">
                <label className="input-label">ক্রেতা নির্বাচন *</label>
                <div style={{ position: 'relative' }}>
                  <div className="search-bar" style={{ marginBottom: 0 }}>
                    <User size={14} color="var(--text3)" />
                    <input value={buyerSearch} onChange={e => { setBuyerSearch(e.target.value); setSelBuyer(null); setShowBDD(true) }} onFocus={() => setShowBDD(true)} placeholder="ক্রেতার নাম লিখুন..." />
                    <ChevronDown size={14} color="var(--text3)" />
                  </div>
                  {showBDD && fBuyers.length > 0 && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowBDD(false)} />
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', zIndex: 20, maxHeight: 170, overflowY: 'auto', marginTop: 4 }}>
                        {fBuyers.map(b => (
                          <button key={b.id} onClick={() => { setSelBuyer(b); setBuyerSearch(b.name); setShowBDD(false) }} style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: '0.82rem', fontFamily: 'var(--font-bn)', color: 'var(--text)' }}>
                            {b.name} {b.phone && <span style={{ color: 'var(--text3)' }}>· {b.phone}</span>}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {selBuyer && <div style={{ fontSize: '0.72rem', color: 'var(--success)', marginTop: 4, fontFamily: 'var(--font-bn)' }}>✅ {selBuyer.name} নির্বাচিত</div>}
              </div>
              {/* Product select */}
              <div className="input-group">
                <label className="input-label">পণ্য নির্বাচন (ঐচ্ছিক)</label>
                <div style={{ position: 'relative' }}>
                  <div className="search-bar" style={{ marginBottom: 0 }}>
                    <Package size={14} color="var(--text3)" />
                    <input value={prodSearch} onChange={e => { setProdSearch(e.target.value); setSelProd(null); setShowPDD(true) }} onFocus={() => setShowPDD(true)} placeholder="পণ্য খুঁজুন..." />
                  </div>
                  {showPDD && fProds.length > 0 && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowPDD(false)} />
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', zIndex: 20, maxHeight: 150, overflowY: 'auto', marginTop: 4 }}>
                        {fProds.map(p => (
                          <button key={p.id} onClick={() => { setSelProd(p); setProdSearch(p.name); setDuePrice(String(p.sell_price)); setDueUnit(p.unit); setShowPDD(false) }} style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: '0.82rem', fontFamily: 'var(--font-bn)', color: 'var(--text)' }}>
                            {p.name} <span style={{ color: 'var(--text3)' }}>· {fmt(p.sell_price)} · {p.quantity} {p.unit}</span>
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
                  <input className="input" type="number" placeholder="1" value={dueQty} onChange={e => setDueQty(e.target.value)} min="0" step="any" />
                </div>
                <div className="input-group">
                  <label className="input-label">একক মূল্য *</label>
                  <input className="input" type="number" placeholder="0.00" value={duePrice} onChange={e => setDuePrice(e.target.value)} step="any" />
                </div>
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">অগ্রিম পরিশোধ</label>
                  <input className="input" type="number" placeholder="0" value={duePaid} onChange={e => setDuePaid(e.target.value)} min="0" />
                </div>
                <div className="input-group">
                  <label className="input-label">শেষ তারিখ</label>
                  <input className="input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">নোট</label>
                <input className="input" placeholder="অতিরিক্ত তথ্য..." value={dueNotes} onChange={e => setDueNotes(e.target.value)} />
              </div>
              {dueQty && duePrice && calcTotal > 0 && (
                <div style={{ background: 'var(--primary-bg)', borderRadius: 10, padding: '11px 14px', marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-bn)', color: 'var(--text2)' }}>মোট মূল্য</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(calcTotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-bn)', color: 'var(--text2)' }}>বকেয়া থাকবে</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--danger)' }}>{fmt(calcRem)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setModal(null)}>বাতিল</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={addDue} disabled={saving}>
                {saving ? 'সংরক্ষণ...' : '✅ বকেয়া যোগ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ PAYMENT MODAL ══ */}
      {modal === 'payment' && editEntry && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal modal-simple" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span className="modal-title">💳 পেমেন্ট গ্রহণ</span>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-bn)', fontSize: '0.95rem', marginBottom: 6 }}>{editEntry.buyer_name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>মোট</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(editEntry.total_amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>পরিশোধিত</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--success)' }}>{fmt(editEntry.paid_amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-bn)', color: 'var(--danger)' }}>বকেয়া</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--danger)', fontSize: '1rem' }}>{fmt(editEntry.remaining)}</span>
              </div>
              <div className="progress-bar" style={{ marginTop: 10 }}>
                <div className="progress-fill" style={{ width: `${Math.min(100, (editEntry.paid_amount / editEntry.total_amount) * 100)}%`, background: 'var(--success)' }} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">পেমেন্টের পরিমাণ *</label>
              <input className="input" type="number" placeholder={String(editEntry.remaining)} value={payAmt} onChange={e => setPayAmt(e.target.value)} autoFocus step="any" />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button className="btn btn-ghost btn-xs" onClick={() => setPayAmt(String(editEntry.remaining))}>সম্পূর্ণ</button>
              <button className="btn btn-ghost btn-xs" onClick={() => setPayAmt(String(Math.round(editEntry.remaining / 2)))}>অর্ধেক</button>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setModal(null)}>বাতিল</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={doPayment} disabled={saving}>
                {saving ? 'সংরক্ষণ...' : '✅ পেমেন্ট নিশ্চিত করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ ADD BUYER MODAL ══ */}
      {modal === 'buyer' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-handle" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="modal-title">👤 নতুন ক্রেতা যোগ</span>
                <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4 }}>
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">নাম *</label>
                <input className="input" placeholder="ক্রেতার পুরো নাম" value={bName} onChange={e => setBName(e.target.value)} autoFocus />
              </div>
              <div className="input-group">
                <label className="input-label">ফোন নম্বর</label>
                <input className="input" type="tel" placeholder="01XXXXXXXXX" value={bPhone} onChange={e => setBPhone(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">ইমেইল (ঐচ্ছিক)</label>
                <input className="input" type="email" placeholder="email@example.com" value={bEmail} onChange={e => setBEmail(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">ঠিকানা</label>
                <input className="input" placeholder="ঠিকানা লিখুন" value={bAddr} onChange={e => setBAddr(e.target.value)} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">নোট</label>
                <input className="input" placeholder="অতিরিক্ত তথ্য" value={bNotes} onChange={e => setBNotes(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setModal(null)}>বাতিল</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={addBuyer} disabled={saving}>
                {saving ? 'সংরক্ষণ...' : '✅ ক্রেতা যোগ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ BUYER PROFILE ══ */}
      {profileBuyer && (
        <BuyerProfile buyer={profileBuyer} dues={dueLedger} fmt={fmt} onClose={() => setProfileBuyer(null)} />
      )}

    </div>
  )
}
