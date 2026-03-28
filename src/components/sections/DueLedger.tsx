'use client'
import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '@/lib/app-store'
import { useApi } from '@/lib/api'
import { useToast } from '@/lib/toast-context'
import { formatCurrency, formatDateShort, UNITS } from '@/lib/utils'
import type { DueLedgerEntry, Buyer, InventoryItem } from '@/types'
import { Search, Plus, BookOpen, User, Package, CreditCard, ChevronDown, Trash2, RefreshCw, X, Phone, MapPin, FileText, TrendingUp, Clock } from 'lucide-react'

type DueTab = 'all' | 'pending' | 'partial' | 'overdue' | 'paid' | 'buyers'

// ── Buyer Profile Bottom Sheet (Issue #6) ──
function BuyerProfileSheet({ buyer, dueLedger, fmt, onClose }: {
  buyer: Buyer
  dueLedger: DueLedgerEntry[]
  fmt: (v: number) => string
  onClose: () => void
}) {
  const buyerDues = dueLedger.filter(e => e.buyer_id === buyer.id || e.buyer_name === buyer.name)
  const totalDue = buyerDues.filter(e => e.status !== 'Paid').reduce((s, e) => s + e.remaining, 0)
  const totalPaid = buyerDues.reduce((s, e) => s + e.paid_amount, 0)
  const totalTransactions = buyerDues.reduce((s, e) => s + e.total_amount, 0)
  const pendingCount = buyerDues.filter(e => e.status !== 'Paid').length

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '94dvh', overflowY: 'auto' }}>
        <div className="modal-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--info-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👤</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', fontFamily: 'var(--font-bn)' }}>{buyer.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>ক্রেতার প্রোফাইল</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Contact info */}
        <div style={{ background: 'var(--surface2)', borderRadius: 14, padding: 14, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {buyer.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Phone size={14} color="var(--info)" />
              <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontFamily: 'var(--font-bn)' }}>{buyer.phone}</span>
            </div>
          )}
          {buyer.address && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <MapPin size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontFamily: 'var(--font-bn)' }}>{buyer.address}</span>
            </div>
          )}
          {buyer.notes && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <FileText size={14} color="var(--text3)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text2)', fontFamily: 'var(--font-bn)' }}>{buyer.notes}</span>
            </div>
          )}
          {!buyer.phone && !buyer.address && !buyer.notes && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)', textAlign: 'center' }}>কোনো অতিরিক্ত তথ্য নেই</div>
          )}
        </div>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          <div style={{ background: 'var(--danger-light)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1rem', color: 'var(--danger)' }}>{fmt(totalDue)}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)', marginTop: 2 }}>মোট বকেয়া ({pendingCount}টি)</div>
          </div>
          <div style={{ background: 'var(--success-light)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1rem', color: 'var(--success)' }}>{fmt(totalPaid)}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)', marginTop: 2 }}>মোট পরিশোধ</div>
          </div>
          <div style={{ background: 'var(--primary-bg)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>{fmt(totalTransactions)}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)', marginTop: 2 }}>মোট লেনদেন</div>
          </div>
          <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>{buyerDues.length}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)', marginTop: 2 }}>মোট রেকর্ড</div>
          </div>
        </div>

        {/* Transaction history */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <TrendingUp size={14} color="var(--primary)" />
            <span style={{ fontWeight: 700, fontSize: '0.88rem', fontFamily: 'var(--font-bn)', color: 'var(--text)' }}>লেনদেনের ইতিহাস</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>({buyerDues.length} টি)</span>
          </div>
          {buyerDues.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0', fontSize: '0.78rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>কোনো লেনদেন নেই</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {buyerDues.map(entry => {
                const pct = Math.min(100, entry.total_amount > 0 ? (entry.paid_amount / entry.total_amount) * 100 : 0)
                const isOverdue = (entry.status === 'Pending' || entry.status === 'Partial') && entry.due_date && new Date(entry.due_date) < new Date()
                return (
                  <div key={entry.id} style={{ background: 'var(--surface2)', borderRadius: 12, padding: '10px 12px', borderLeft: `3px solid ${isOverdue ? 'var(--danger)' : entry.status === 'Paid' ? 'var(--success)' : entry.status === 'Partial' ? 'var(--warning)' : 'var(--border)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text)', fontFamily: 'var(--font-bn)' }}>{entry.product_name || 'বিবিধ'}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>{entry.quantity} {entry.unit} × {fmt(entry.unit_price)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Clock size={10} color="var(--text3)" />
                          <span style={{ fontSize: '0.65rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>
                            {formatDateShort(entry.created_at)}
                            {entry.due_date && ` · মেয়াদ: ${formatDateShort(entry.due_date)}`}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.88rem', color: entry.status === 'Paid' ? 'var(--success)' : 'var(--danger)' }}>
                          {fmt(entry.remaining)}
                        </div>
                        <span className={`badge ${entry.status === 'Paid' ? 'badge-success' : entry.status === 'Partial' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.6rem' }}>
                          {entry.status === 'Paid' ? 'পরিশোধ' : entry.status === 'Partial' ? 'আংশিক' : 'বকেয়া'}
                        </span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--success)' : pct > 50 ? 'var(--warning)' : 'var(--danger)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: '0.62rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>
                      <span>পরিশোধ: {fmt(entry.paid_amount)}</span>
                      <span>মোট: {fmt(entry.total_amount)}</span>
                    </div>
                    {entry.notes && <div style={{ marginTop: 4, fontSize: '0.65rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>💬 {entry.notes}</div>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <button className="btn btn-ghost btn-full" style={{ marginTop: 14 }} onClick={onClose}>বন্ধ করুন</button>
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
    setDueLedger(entries)
    setBuyers(buyerList)
    if (inventory.length === 0) setInventory(await api.getInventory())
    setLoading(false)
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [])

  const summary = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    let total = 0, overdue = 0, paid = 0
    dueLedger.forEach(e => {
      if (e.status !== 'Paid') {
        total += e.remaining
        if (e.due_date && new Date(e.due_date) < today) overdue += e.remaining
      } else { paid += e.total_amount }
    })
    return { total, overdue, paid, count: dueLedger.filter(e => e.status !== 'Paid').length }
  }, [dueLedger])

  const displayEntries = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
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
      const payload = { buyer_id:selBuyer.id, buyer_name:selBuyer.name, product_id:selProduct?.id, product_name:selProduct?.name||'বিবিধ', quantity:parseFloat(dueForm.qty), unit:dueForm.unit, unit_price:parseFloat(dueForm.unitPrice), total_amount:calcTotal, paid_amount:parseFloat(dueForm.paidAmount)||0, due_date:dueForm.dueDate||undefined, notes:dueForm.notes }
      const created = await api.addDueEntry(payload)
      setDueLedger([created, ...dueLedger])
      toast('বকেয়া যোগ হয়েছে ✅', 'ok')
      setModal(null)
      setSelBuyer(null); setBuyerSearch('')
      setSelProduct(null); setProdSearch('')
      setDueForm({ qty:'', unit:'pcs', unitPrice:'', paidAmount:'0', dueDate:'', notes:'' })
    } catch (e: unknown) { toast((e as Error).message||'সমস্যা হয়েছে', 'er') }
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
      toast('পেমেন্ট সম্পন্ন ✅', 'ok')
      setModal(null); setPayAmount('')
    } catch (e: unknown) { toast((e as Error).message||'সমস্যা হয়েছে', 'er') }
    setSaving(false)
  }

  async function deleteDue(entry: DueLedgerEntry) {
    if (!confirm(`"${entry.buyer_name}" এর বকেয়া মুছবেন?`)) return
    try {
      await api.deleteDueEntry(entry.id)
      setDueLedger(dueLedger.filter(e => e.id !== entry.id))
      toast('মুছে ফেলা হয়েছে', 'wa')
    } catch (e: unknown) { toast((e as Error).message||'সমস্যা', 'er') }
  }

  async function addBuyer() {
    if (!buyerForm.name) return toast('নাম দিন', 'er')
    setSaving(true)
    try {
      const created = await api.addBuyer(buyerForm)
      setBuyers([created, ...buyers])
      toast('ক্রেতা যোগ হয়েছে ✅', 'ok')
      setModal(null); setBuyerForm({ name:'', phone:'', email:'', address:'', notes:'' })
    } catch (e: unknown) { toast((e as Error).message||'সমস্যা', 'er') }
    setSaving(false)
  }

  const TABS: { id: DueTab; label: string }[] = [
    { id:'all', label:'সব' },
    { id:'pending', label:'বকেয়া' },
    { id:'partial', label:'আংশিক' },
    { id:'overdue', label:'⚠ মেয়াদ' },
    { id:'paid', label:'✅ পরিশোধ' },
    { id:'buyers', label:'👥 ক্রেতা' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* Summary */}
      <div className="kpi-grid anim-fade-up">
        <div className="kpi-card" style={{ '--kpi-color':'var(--danger)' } as React.CSSProperties}>
          <div className="kpi-icon" style={{ background:'var(--danger-light)', color:'var(--danger)' }}><BookOpen size={18}/></div>
          <div className="kpi-value">{fmt(summary.total)}</div>
          <div className="kpi-label">মোট বকেয়া ({summary.count} জন)</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-color':'var(--warning)' } as React.CSSProperties}>
          <div className="kpi-icon" style={{ background:'var(--warning-light)', color:'var(--warning)' }}><CreditCard size={18}/></div>
          <div className="kpi-value">{fmt(summary.overdue)}</div>
          <div className="kpi-label">মেয়াদ উত্তীর্ণ</div>
        </div>
      </div>

      {/* Tab + Search + Buttons — Responsive */}
      <div className="card card-p anim-fade-up anim-d1">
        <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch', display:'flex', gap:6, paddingBottom:10, marginBottom:10, scrollbarWidth:'none' }}>
          {TABS.map(t => (
            <button key={t.id} className={`chip ${tab===t.id?'active':''}`} style={{ flexShrink:0 }} onClick={()=>setTab(t.id)}>{t.label}</button>
          ))}
        </div>
        {/* Responsive search+buttons row */}
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {/* Search bar — flex grows */}
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:8, background:'var(--surface2)', border:'1.5px solid var(--border)', borderRadius:12, padding:'0 12px', height:42, minWidth:0 }}>
            <Search size={14} color="var(--text3)" style={{ flexShrink:0 }}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="নাম বা পণ্য খুঁজুন..."
              style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'var(--text)', fontSize:'0.82rem', fontFamily:'var(--font-bn)', minWidth:0 }}
            />
            {search && <button onClick={()=>setSearch('')} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', padding:0, flexShrink:0 }}>✕</button>}
          </div>
          {/* Action icons — always visible */}
          <button className="btn btn-primary btn-sm btn-icon" onClick={()=>setModal('add')} title="নতুন বকেয়া যোগ" style={{ width:42, height:42, padding:0, flexShrink:0 }}><Plus size={18}/></button>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>setModal('buyer')} title="নতুন ক্রেতা যোগ" style={{ width:42, height:42, padding:0, flexShrink:0 }}><User size={16}/></button>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={load} title="রিফ্রেশ" style={{ width:42, height:42, padding:0, flexShrink:0 }}><RefreshCw size={15} className={loading?'spin':''}/></button>
        </div>
      </div>

      {/* Buyers list */}
      {tab === 'buyers' ? (
        <div className="card anim-fade-up anim-d2">
          {buyers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <div className="empty-title">কোনো ক্রেতা নেই</div>
              <div className="empty-sub">উপরের বোতামে ক্লিক করে ক্রেতা যোগ করুন</div>
            </div>
          ) : buyers.map(b => (
            <div key={b.id} className="list-item" onClick={()=>setProfileBuyer(b)} style={{ cursor:'pointer' }}>
              <div className="list-icon" style={{ background:'var(--info-light)', color:'var(--info)' }}><User size={16}/></div>
              <div className="list-info">
                <div className="list-title">{b.name}</div>
                <div className="list-sub">{b.phone||'ফোন নেই'}{b.address?' · '+b.address:''}</div>
              </div>
              <div style={{ fontSize:'0.62rem', color:'var(--primary)', fontFamily:'var(--font-bn)', flexShrink:0 }}>প্রোফাইল →</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {loading && [1,2,3].map(i => (
            <div key={i} className="card card-p">
              <div className="skeleton" style={{ height:14, marginBottom:8, borderRadius:6 }}/>
              <div className="skeleton" style={{ height:10, width:'60%', borderRadius:6 }}/>
            </div>
          ))}

          {!loading && displayEntries.length === 0 && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">📒</div>
                <div className="empty-title">কোনো বকেয়া নেই</div>
                <div className="empty-sub">নতুন বকেয়া যোগ করতে + বোতামে ক্লিক করুন</div>
              </div>
            </div>
          )}

          {!loading && displayEntries.map(entry => {
            const pct = Math.min(100, entry.total_amount>0 ? (entry.paid_amount/entry.total_amount)*100 : 0)
            const isOverdue = (entry.status==='Pending'||entry.status==='Partial') && entry.due_date && new Date(entry.due_date) < new Date()
            const cardClass = isOverdue?'overdue':entry.status==='Partial'?'partial':entry.status==='Paid'?'paid':''
            return (
              <div key={entry.id} className={`due-card ${cardClass} anim-fade-up`}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div style={{ flex:1, minWidth:0, marginRight:10 }}>
                    <div style={{ fontWeight:700, fontSize:'0.88rem', color:'var(--text)', fontFamily:'var(--font-bn)', marginBottom:2 }}>{entry.buyer_name}</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text3)', fontFamily:'var(--font-bn)' }}>{entry.product_name} · {entry.quantity} {entry.unit}</div>
                    {entry.due_date && <div style={{ fontSize:'0.68rem', color:isOverdue?'var(--danger)':'var(--text3)', marginTop:2, fontFamily:'var(--font-bn)' }}>{isOverdue?'⚠ মেয়াদ শেষ: ':'📅 '}{formatDateShort(entry.due_date)}</div>}
                    {entry.notes && <div style={{ fontSize:'0.68rem', color:'var(--text3)', marginTop:2, fontFamily:'var(--font-bn)' }}>💬 {entry.notes}</div>}
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:'var(--font-mono)', fontWeight:800, fontSize:'0.95rem', color:entry.status==='Paid'?'var(--success)':'var(--danger)' }}>{fmt(entry.remaining)}</div>
                    <span className={`badge ${entry.status==='Paid'?'badge-success':entry.status==='Partial'?'badge-warning':'badge-danger'}`} style={{ marginTop:4, display:'inline-block' }}>
                      {entry.status==='Paid'?'পরিশোধ':entry.status==='Partial'?'আংশিক':'বকেয়া'}
                    </span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width:`${pct}%`, background:pct===100?'var(--success)':pct>50?'var(--warning)':'var(--danger)' }}/>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontSize:'0.65rem', color:'var(--text3)', fontFamily:'var(--font-bn)' }}>
                  <span>পরিশোধ: {fmt(entry.paid_amount)}</span>
                  <span>মোট: {fmt(entry.total_amount)}</span>
                </div>
                <div style={{ display:'flex', gap:8, marginTop:10 }}>
                  {entry.status !== 'Paid' && (
                    <button className="btn btn-primary btn-sm" style={{ flex:1 }} onClick={()=>{setEditEntry(entry);setModal('payment')}}><CreditCard size={14}/> পেমেন্ট নিন</button>
                  )}
                  <button className="btn btn-danger btn-xs" onClick={()=>deleteDue(entry)} style={{ width:34, padding:0 }}><Trash2 size={14}/></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── ADD DUE MODAL — Responsive ── */}
      {modal === 'add' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}
            style={{ maxHeight:'calc(96dvh - env(safe-area-inset-bottom))', overflowY:'hidden', display:'flex', flexDirection:'column', padding:0 }}>

            {/* Header */}
            <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              <div className="modal-handle" style={{ marginBottom:12 }}/>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div className="modal-title" style={{ marginBottom:0 }}>📝 নতুন বকেয়া যোগ</div>
                <button onClick={()=>setModal(null)} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', padding:4 }}><X size={20}/></button>
              </div>
            </div>

            {/* Scrollable body */}
            <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', WebkitOverflowScrolling:'touch' }}>
              {/* Buyer Select */}
              <div className="input-group">
                <label className="input-label">ক্রেতা নির্বাচন *</label>
                <div style={{ position:'relative' }}>
                  <div className="search-bar" style={{ marginBottom:0 }}>
                    <User size={14} color="var(--text3)"/>
                    <input value={buyerSearch} onChange={e=>{setBuyerSearch(e.target.value);setSelBuyer(null);setShowBuyerDd(true)}} onFocus={()=>setShowBuyerDd(true)} placeholder="ক্রেতার নাম লিখুন..."/>
                    <ChevronDown size={14} color="var(--text3)"/>
                  </div>
                  {showBuyerDd && filteredBuyers.length > 0 && (
                    <>
                      <div style={{ position:'fixed', inset:0, zIndex:10 }} onClick={()=>setShowBuyerDd(false)}/>
                      <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, boxShadow:'var(--shadow-lg)', zIndex:20, maxHeight:180, overflowY:'auto', marginTop:4 }}>
                        {filteredBuyers.map(b => (
                          <button key={b.id} onClick={()=>{setSelBuyer(b);setBuyerSearch(b.name);setShowBuyerDd(false)}}
                            style={{ width:'100%', padding:'10px 14px', textAlign:'left', background:'none', border:'none', cursor:'pointer', borderBottom:'1px solid var(--border)', fontSize:'0.82rem', fontFamily:'var(--font-bn)', color:'var(--text)' }}>
                            {b.name} {b.phone&&<span style={{ color:'var(--text3)' }}>· {b.phone}</span>}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {selBuyer && <div style={{ fontSize:'0.72rem', color:'var(--success)', marginTop:4, fontFamily:'var(--font-bn)' }}>✅ {selBuyer.name} নির্বাচিত</div>}
              </div>

              {/* Product Select */}
              <div className="input-group">
                <label className="input-label">পণ্য নির্বাচন (ঐচ্ছিক)</label>
                <div style={{ position:'relative' }}>
                  <div className="search-bar" style={{ marginBottom:0 }}>
                    <Package size={14} color="var(--text3)"/>
                    <input value={prodSearch} onChange={e=>{setProdSearch(e.target.value);setSelProduct(null);setShowProdDd(true)}} onFocus={()=>setShowProdDd(true)} placeholder="পণ্য খুঁজুন..."/>
                  </div>
                  {showProdDd && filteredProds.length > 0 && (
                    <>
                      <div style={{ position:'fixed', inset:0, zIndex:10 }} onClick={()=>setShowProdDd(false)}/>
                      <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, boxShadow:'var(--shadow-lg)', zIndex:20, maxHeight:160, overflowY:'auto', marginTop:4 }}>
                        {filteredProds.map(p => (
                          <button key={p.id} onClick={()=>{setSelProduct(p);setProdSearch(p.name);setDueForm(f=>({...f,unitPrice:String(p.sell_price),unit:p.unit}));setShowProdDd(false)}}
                            style={{ width:'100%', padding:'10px 14px', textAlign:'left', background:'none', border:'none', cursor:'pointer', borderBottom:'1px solid var(--border)', fontSize:'0.82rem', fontFamily:'var(--font-bn)', color:'var(--text)' }}>
                            {p.name} <span style={{ color:'var(--text3)' }}>· {fmt(p.sell_price)} · {p.quantity} {p.unit}</span>
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
                  <input className="input" type="number" placeholder="1" value={dueForm.qty} onChange={e=>setDueForm(f=>({...f,qty:e.target.value}))} min="0" step="any"/>
                </div>
                <div className="input-group">
                  <label className="input-label">একক মূল্য *</label>
                  <input className="input" type="number" placeholder="0.00" value={dueForm.unitPrice} onChange={e=>setDueForm(f=>({...f,unitPrice:e.target.value}))} step="any"/>
                </div>
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">অগ্রিম পরিশোধ</label>
                  <input className="input" type="number" placeholder="0" value={dueForm.paidAmount} onChange={e=>setDueForm(f=>({...f,paidAmount:e.target.value}))} min="0"/>
                </div>
                <div className="input-group">
                  <label className="input-label">শেষ তারিখ</label>
                  <input className="input" type="date" value={dueForm.dueDate} onChange={e=>setDueForm(f=>({...f,dueDate:e.target.value}))}/>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">নোট</label>
                <input className="input" placeholder="অতিরিক্ত তথ্য..." value={dueForm.notes} onChange={e=>setDueForm(f=>({...f,notes:e.target.value}))}/>
              </div>

              {dueForm.qty && dueForm.unitPrice && calcTotal > 0 && (
                <div style={{ background:'var(--primary-bg)', borderRadius:10, padding:'12px 14px', marginBottom:4 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:'0.78rem', fontFamily:'var(--font-bn)', color:'var(--text2)' }}>মোট মূল্য</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontWeight:700 }}>{fmt(calcTotal)}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:'0.78rem', fontFamily:'var(--font-bn)', color:'var(--text2)' }}>বকেয়া থাকবে</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontWeight:800, color:'var(--danger)' }}>{fmt(calcRemaining)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Fixed footer */}
            <div style={{ display:'flex', gap:10, padding:'12px 20px calc(12px + env(safe-area-inset-bottom))', borderTop:'1px solid var(--border)', background:'var(--surface)', flexShrink:0 }}>
              <button className="btn btn-ghost" style={{ flex:1 }} onClick={()=>setModal(null)}>বাতিল</button>
              <button className="btn btn-primary" style={{ flex:2 }} onClick={addDue} disabled={saving}>
                {saving ? 'সংরক্ষণ হচ্ছে...' : '✅ বকেয়া যোগ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PAYMENT MODAL ── */}
      {modal === 'payment' && editEntry && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle"/>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div className="modal-title" style={{ marginBottom:0 }}>💳 পেমেন্ট গ্রহণ</div>
              <button onClick={()=>setModal(null)} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer' }}><X size={18}/></button>
            </div>
            <div style={{ background:'var(--surface2)', borderRadius:12, padding:'14px', marginBottom:16 }}>
              <div style={{ fontWeight:700, fontFamily:'var(--font-bn)', fontSize:'0.95rem', marginBottom:6 }}>{editEntry.buyer_name}</div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}><span style={{ fontSize:'0.75rem', color:'var(--text3)', fontFamily:'var(--font-bn)' }}>মোট</span><span style={{ fontFamily:'var(--font-mono)', fontWeight:600 }}>{fmt(editEntry.total_amount)}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}><span style={{ fontSize:'0.75rem', color:'var(--text3)', fontFamily:'var(--font-bn)' }}>পরিশোধিত</span><span style={{ fontFamily:'var(--font-mono)', fontWeight:600, color:'var(--success)' }}>{fmt(editEntry.paid_amount)}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ fontSize:'0.75rem', fontWeight:700, fontFamily:'var(--font-bn)', color:'var(--danger)' }}>বকেয়া</span><span style={{ fontFamily:'var(--font-mono)', fontWeight:800, color:'var(--danger)', fontSize:'1rem' }}>{fmt(editEntry.remaining)}</span></div>
              <div className="progress-bar" style={{ marginTop:10 }}><div className="progress-fill" style={{ width:`${Math.min(100,(editEntry.paid_amount/editEntry.total_amount)*100)}%`, background:'var(--success)' }}/></div>
            </div>
            <div className="input-group">
              <label className="input-label">পেমেন্টের পরিমাণ *</label>
              <input className="input" type="number" placeholder={String(editEntry.remaining)} value={payAmount} onChange={e=>setPayAmount(e.target.value)} autoFocus step="any"/>
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:14 }}>
              <button className="btn btn-ghost btn-xs" onClick={()=>setPayAmount(String(editEntry.remaining))}>সম্পূর্ণ</button>
              <button className="btn btn-ghost btn-xs" onClick={()=>setPayAmount(String(Math.round(editEntry.remaining/2)))}>অর্ধেক</button>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-ghost" style={{ flex:1 }} onClick={()=>setModal(null)}>বাতিল</button>
              <button className="btn btn-primary" style={{ flex:2 }} onClick={doPayment} disabled={saving}>{saving?'সংরক্ষণ...':'✅ পেমেন্ট নিশ্চিত করুন'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD BUYER MODAL — Responsive ── */}
      {modal === 'buyer' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}
            style={{ maxHeight:'calc(96dvh - env(safe-area-inset-bottom))', overflowY:'hidden', display:'flex', flexDirection:'column', padding:0 }}>

            {/* Header */}
            <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              <div className="modal-handle" style={{ marginBottom:12 }}/>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div className="modal-title" style={{ marginBottom:0 }}>👤 নতুন ক্রেতা যোগ</div>
                <button onClick={()=>setModal(null)} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', padding:4 }}><X size={20}/></button>
              </div>
            </div>

            {/* Scrollable body */}
            <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', WebkitOverflowScrolling:'touch' }}>
              <div className="input-group">
                <label className="input-label">নাম *</label>
                <input className="input" placeholder="ক্রেতার পুরো নাম" value={buyerForm.name} onChange={e=>setBuyerForm(f=>({...f,name:e.target.value}))} autoFocus/>
              </div>
              <div className="input-group">
                <label className="input-label">ফোন নম্বর</label>
                <input className="input" type="tel" placeholder="01XXXXXXXXX" value={buyerForm.phone} onChange={e=>setBuyerForm(f=>({...f,phone:e.target.value}))}/>
              </div>
              <div className="input-group">
                <label className="input-label">ইমেইল (ঐচ্ছিক)</label>
                <input className="input" type="email" placeholder="email@example.com" value={buyerForm.email} onChange={e=>setBuyerForm(f=>({...f,email:e.target.value}))}/>
              </div>
              <div className="input-group">
                <label className="input-label">ঠিকানা</label>
                <input className="input" placeholder="ঠিকানা লিখুন" value={buyerForm.address} onChange={e=>setBuyerForm(f=>({...f,address:e.target.value}))}/>
              </div>
              <div className="input-group" style={{ marginBottom:4 }}>
                <label className="input-label">নোট</label>
                <input className="input" placeholder="অতিরিক্ত তথ্য" value={buyerForm.notes} onChange={e=>setBuyerForm(f=>({...f,notes:e.target.value}))}/>
              </div>
            </div>

            {/* Fixed footer */}
            <div style={{ display:'flex', gap:10, padding:'12px 20px calc(12px + env(safe-area-inset-bottom))', borderTop:'1px solid var(--border)', background:'var(--surface)', flexShrink:0 }}>
              <button className="btn btn-ghost" style={{ flex:1 }} onClick={()=>setModal(null)}>বাতিল</button>
              <button className="btn btn-primary" style={{ flex:2 }} onClick={addBuyer} disabled={saving}>
                {saving ? 'সংরক্ষণ...' : '✅ ক্রেতা যোগ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BUYER PROFILE SHEET (Issue #6) ── */}
      {profileBuyer && (
        <BuyerProfileSheet buyer={profileBuyer} dueLedger={dueLedger} fmt={fmt} onClose={()=>setProfileBuyer(null)}/>
      )}
    </div>
  )
}
