'use client'
import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '@/lib/app-store'
import { useApi } from '@/lib/api'
import { useToast } from '@/lib/toast-context'
import { formatCurrency, UNITS, CATEGORIES } from '@/lib/utils'
import type { InventoryItem } from '@/types'
import { Search, Plus, Edit2, Trash2, Archive, ChevronLeft, ChevronRight, QrCode, RefreshCw, Package, Tag, Info, ScanLine } from 'lucide-react'

type SK = 'name' | 'category' | 'quantity' | 'buy_price' | 'sell_price'

const CAT_EMOJI: Record<string, string> = {
  Electronics: '⚡', Clothing: '👕', 'Food & Beverage': '🍎', Furniture: '🪑',
  Books: '📚', Stationery: '✏️', Medicine: '💊', Cosmetics: '💄',
  Hardware: '🔧', Toys: '🎮', Sports: '⚽', Automotive: '🚗', Agriculture: '🌾', General: '📦'
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'In Stock') return <span className="badge badge-success">✓ আছে</span>
  if (status === 'Low Stock') return <span className="badge badge-warning">⚠ কম</span>
  if (status === 'Out of Stock') return <span className="badge badge-danger">✕ শেষ</span>
  return <span className="badge badge-neutral">📦 আর্কাইভ</span>
}

function generateBarcode(name: string): string {
  const ts = Date.now().toString(36).toUpperCase()
  const prefix = name.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase() || 'PRD'
  return `${prefix}-${ts}`
}

function BarcodeVisual({ value }: { value: string }) {
  if (!value) return null
  return (
    <div style={{ textAlign: 'center', padding: '14px 12px', background: 'white', borderRadius: 12, border: '1px solid #e5e5e5' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 1, height: 52, marginBottom: 8 }}>
        <div style={{ width: 2, height: 52, background: '#000', borderRadius: 1 }} />
        <div style={{ width: 1, height: 52, background: '#000' }} />
        {value.split('').map((char, i) => {
          const code = char.charCodeAt(0)
          const widths = [2, 1, 3, 1, 2, 1, 3, 2, 1, 2]
          const w = widths[(code + i) % widths.length]
          const isGap = i % 2 === 1
          return <div key={i} style={{ width: w * 2, height: isGap ? 44 : 52, background: isGap ? 'white' : '#000', borderRadius: 1 }} />
        })}
        <div style={{ width: 1, height: 52, background: '#000' }} />
        <div style={{ width: 2, height: 52, background: '#000', borderRadius: 1 }} />
      </div>
      <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', letterSpacing: '0.12em', color: '#222', userSelect: 'all', fontWeight: 600 }}>{value}</div>
    </div>
  )
}

/* ── Issue 8: Barcode info modal — shows public-safe product details ── */
function BarcodeInfoModal({ item, onClose, fmt }: { item: InventoryItem; onClose: () => void; fmt: (v: number) => string }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ScanLine size={18} color="var(--primary)" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-bn)', color: 'var(--text)' }}>পণ্যের বিবরণ</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4 }}>✕</button>
        </div>
        {/* 1. Name + 3. Category */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
            {item.image_url ? <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} /> : CAT_EMOJI[item.category] || '📦'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', fontFamily: 'var(--font-bn)', marginBottom: 4 }}>{item.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Tag size={12} color="var(--text3)" />
              <span style={{ fontSize: '0.72rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>{item.category}</span>
            </div>
          </div>
        </div>
        {/* 2. Description */}
        {item.notes && (
          <div style={{ display: 'flex', gap: 8, background: 'var(--surface2)', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
            <Info size={14} color="var(--info)" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text2)', fontFamily: 'var(--font-bn)', lineHeight: 1.5 }}>{item.notes}</span>
          </div>
        )}
        {/* 4. Sell price */}
        <div style={{ background: 'var(--success-light)', borderRadius: 12, padding: '12px 16px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text2)', fontFamily: 'var(--font-bn)' }}>বিক্রয় মূল্য</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--success)' }}>{fmt(item.sell_price)}</span>
        </div>
        {/* Barcode visual */}
        {item.product_link && <div style={{ marginBottom: 12 }}><BarcodeVisual value={item.product_link} /></div>}
        {/* 5. Digiboi unique identifier */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'linear-gradient(135deg,var(--primary-bg),rgba(255,152,0,0.07))', border: '1px solid var(--primary-glow)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
          <Package size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-bn)', marginBottom: 2 }}>Digiboi তালিকাভুক্ত পণ্য ✓</div>
            <div style={{ fontSize: '0.64rem', color: 'var(--text3)', fontFamily: 'monospace', wordBreak: 'break-all' }}>ID: {item.product_link || item.id}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-full" onClick={onClose}>বন্ধ করুন</button>
      </div>
    </div>
  )
}

/* ── Issues 1: Sticky-footer form modal — buttons always visible ── */
function FormModal({ title, onClose, onSave, saving, saveLabel, children }: {
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
          /* Use exact height so flex children can fill it */
          height: 'min(96dvh, 100%)',
          maxHeight: '96dvh',
          display: 'flex', flexDirection: 'column',
          animation: 'sheet-up 0.32s cubic-bezier(0.16,1,0.3,1)',
          overflow: 'hidden',
        }}
      >
        {/* Fixed header */}
        <div style={{ padding: '16px 20px 12px', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
          <div className="modal-handle" style={{ marginBottom: 12 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="modal-title" style={{ marginBottom: 0 }}>{title}</div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4, fontSize: '1.1rem' }}>✕</button>
          </div>
        </div>
        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'scroll', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', padding: '16px 20px' }}>
          {children}
          {/* Extra space so last field isn't hidden behind footer */}
          <div style={{ height: 8 }} />
        </div>
        {/* Sticky footer — always visible */}
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

export default function InventorySection() {
  const { inventory, setInventory, currency } = useAppStore()
  const api = useApi()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [perPage] = useState(20)
  const [page, setPage] = useState(1)
  const [sortKey] = useState<SK>('name')
  const [sortDir] = useState<'asc' | 'desc'>('asc')
  const [modal, setModal] = useState<'add' | 'edit' | 'barcode' | null>(null)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [barcodeItem, setBarcodeItem] = useState<InventoryItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', category: 'General', quantity: '', unit: 'pcs',
    buy_price: '', sell_price: '', notes: '', image_url: '',
    product_link: '', status: 'In Stock', barcode: ''
  })
  const fmt = (v: number) => formatCurrency(v, currency)

  async function load() {
    setLoading(true)
    const d = await api.getInventory()
    setInventory(d)
    setLoading(false)
  }
  useEffect(() => { load() }, []) // eslint-disable-line

  const filtered = useMemo(() => {
    let r = inventory
    if (search) r = r.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter) r = r.filter(i => i.status === statusFilter)
    return [...r].sort((a, b) => {
      const va = a[sortKey] as string | number, vb = b[sortKey] as string | number
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
    })
  }, [inventory, search, statusFilter, sortKey, sortDir])

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.ceil(filtered.length / perPage)

  const profitPerUnit = form.buy_price && form.sell_price ? parseFloat(form.sell_price) - parseFloat(form.buy_price) : null
  const profitMargin = profitPerUnit !== null && parseFloat(form.buy_price) > 0
    ? ((profitPerUnit / parseFloat(form.buy_price)) * 100).toFixed(1) : null

  function openAdd() {
    setEditItem(null)
    setForm({ name: '', category: 'General', quantity: '', unit: 'pcs', buy_price: '', sell_price: '', notes: '', image_url: '', product_link: '', status: 'In Stock', barcode: '' })
    setModal('add')
  }

  function openEdit(item: InventoryItem) {
    setEditItem(item)
    setForm({ name: item.name, category: item.category, quantity: String(item.quantity), unit: item.unit, buy_price: String(item.buy_price), sell_price: String(item.sell_price), notes: item.notes || '', image_url: item.image_url || '', product_link: item.product_link || '', status: item.status, barcode: item.product_link || '' })
    setModal('edit')
  }

  function autoBarcode() {
    const code = generateBarcode(form.name || 'PRD')
    setForm(f => ({ ...f, barcode: code, product_link: code }))
    toast('বারকোড তৈরি হয়েছে ✅', 'ok')
  }

  async function handleSave() {
    if (!form.name.trim()) return toast('পণ্যের নাম দিন', 'er')
    const bp = parseFloat(form.buy_price), sp = parseFloat(form.sell_price), qty = parseFloat(form.quantity)
    if (isNaN(bp) || bp < 0) return toast('সঠিক ক্রয় মূল্য দিন', 'er')
    if (isNaN(sp) || sp < 0) return toast('সঠিক বিক্রয় মূল্য দিন', 'er')
    if (modal === 'add' && (isNaN(qty) || qty < 0)) return toast('সঠিক পরিমাণ দিন', 'er')
    setSaving(true)
    try {
      const payload = { name: form.name.trim(), category: form.category, unit: form.unit, buy_price: bp, sell_price: sp, notes: form.notes, image_url: form.image_url, product_link: form.barcode || form.product_link, ...(modal === 'add' ? { quantity: qty } : { status: form.status as InventoryItem['status'] }) }
      if (modal === 'edit' && editItem) {
        const u = await api.updateProduct(editItem.id, payload)
        setInventory(inventory.map(i => i.id === editItem.id ? { ...i, ...u } : i))
        toast('পণ্য আপডেট হয়েছে ✅', 'ok')
      } else {
        const c = await api.addProduct(payload)
        setInventory([c, ...inventory])
        toast('পণ্য যোগ হয়েছে ✅', 'ok')
      }
      setModal(null)
    } catch (e: unknown) { toast((e as Error).message || 'সমস্যা হয়েছে', 'er') }
    setSaving(false)
  }

  async function handleDelete(item: InventoryItem) {
    if (!confirm(`"${item.name}" মুছে ফেলবেন?`)) return
    try { await api.deleteProduct(item.id); setInventory(inventory.filter(i => i.id !== item.id)); toast('মুছে ফেলা হয়েছে', 'wa') }
    catch (e: unknown) { toast((e as Error).message || 'সমস্যা', 'er') }
  }

  async function handleArchive(item: InventoryItem) {
    const ns = item.status === 'Archived' ? 'In Stock' : 'Archived'
    try { const u = await api.updateProduct(item.id, { status: ns }); setInventory(inventory.map(i => i.id === item.id ? { ...i, ...u } : i)); toast(ns === 'Archived' ? 'আর্কাইভ হয়েছে' : 'পুনরুদ্ধার হয়েছে', 'in') }
    catch { /* ignore */ }
  }

  const STATUS_FILTERS = ['', 'In Stock', 'Low Stock', 'Out of Stock', 'Archived']
  const STATUS_LABELS: Record<string, string> = { '': 'সব', 'In Stock': '✓ স্টক', 'Low Stock': '⚠ কম', 'Out of Stock': '✕ শেষ', 'Archived': '📦 আর্কাইভ' }

  const stats = useMemo(() => {
    const active = inventory.filter(i => i.status !== 'Archived')
    return { total: active.length, value: active.reduce((s, i) => s + i.quantity * i.buy_price, 0), low: active.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock').length }
  }, [inventory])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'মোট পণ্য', value: stats.total, color: 'var(--info)', bg: 'var(--info-light)' },
          { label: 'স্টক মূল্য', value: fmt(stats.value), color: 'var(--primary)', bg: 'var(--primary-bg)', mono: true },
          { label: 'সতর্কতা', value: stats.low, color: stats.low > 0 ? 'var(--danger)' : 'var(--success)', bg: stats.low > 0 ? 'var(--danger-light)' : 'var(--success-light)' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontFamily: s.mono ? 'var(--font-mono)' : 'var(--font-bn)', fontWeight: 700, fontSize: '0.82rem', color: s.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</div>
            <div style={{ fontSize: '0.58rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + Actions */}
      <div className="card card-p">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', fontFamily: 'var(--font-bn)' }}>ইনভেন্টরি</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>{filtered.length} টি পণ্য</div>
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={load}><RefreshCw size={15} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={15} /> যোগ</button>
        </div>
        <div className="search-bar" style={{ marginBottom: 10 }}>
          <Search size={15} color="var(--text3)" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="পণ্যের নাম বা ক্যাটাগরি..." />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 0 }}>✕</button>}
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'scroll', paddingBottom: 2, scrollbarWidth: 'none' }}>
          {STATUS_FILTERS.map(s => (
            <button key={s} className={`chip ${statusFilter === s ? 'active' : ''}`} style={{ flexShrink: 0 }} onClick={() => { setStatusFilter(s); setPage(1) }}>{STATUS_LABELS[s]}</button>
          ))}
        </div>
      </div>

      {loading && [1,2,3,4].map(i => (
        <div key={i} className="card card-p" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0 }} />
          <div style={{ flex: 1 }}><div className="skeleton" style={{ height: 13, marginBottom: 8, borderRadius: 6 }} /><div className="skeleton" style={{ height: 10, width: '55%', borderRadius: 6 }} /></div>
        </div>
      ))}

      {!loading && paginated.length === 0 && (
        <div className="card"><div className="empty-state"><div className="empty-icon">📦</div><div className="empty-title">কোনো পণ্য পাওয়া যায়নি</div><div className="empty-sub">নতুন পণ্য যোগ করুন</div><button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14} /> যোগ করুন</button></div></div>
      )}

      {!loading && paginated.map((item, idx) => (
        <div key={item.id} className="product-card anim-fade-up" style={{ animationDelay: `${idx * 0.03}s` }}>
          <div className="product-img">{item.image_url ? <img src={item.image_url} alt={item.name} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} /> : <span>{CAT_EMOJI[item.category] || '📦'}</span>}</div>
          <div className="product-info">
            <div className="product-name">{item.name}</div>
            <div className="product-category">{item.category} · {item.quantity} {item.unit}</div>
            <div style={{ marginTop: 4, display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
              <StatusBadge status={item.status} />
              <span style={{ fontSize: '0.6rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>লাভ: {fmt(item.sell_price - item.buy_price)}/একক</span>
            </div>
          </div>
          <div className="product-meta">
            <div className="product-price">{fmt(item.sell_price)}</div>
            <div className="text-xs text-muted mono">ক্রয়: {fmt(item.buy_price)}</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {item.product_link && <button className="btn btn-xs btn-ghost" style={{ padding: '4px 6px' }} onClick={() => { setBarcodeItem(item); setModal('barcode') }} title="বারকোড দেখুন"><QrCode size={12} /></button>}
              <button className="btn btn-xs btn-ghost" style={{ padding: '4px 7px' }} onClick={() => openEdit(item)}><Edit2 size={12} /></button>
              <button className="btn btn-xs btn-ghost" style={{ padding: '4px 7px' }} onClick={() => handleArchive(item)} title={item.status === 'Archived' ? 'পুনরুদ্ধার' : 'আর্কাইভ'}><Archive size={12} /></button>
              <button className="btn btn-xs btn-danger" style={{ padding: '4px 7px' }} onClick={() => handleDelete(item)}><Trash2 size={12} /></button>
            </div>
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '8px 0' }}>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={16} /></button>
          <span className="text-sm text-muted">{page} / {totalPages}</span>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={16} /></button>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {(modal === 'add' || modal === 'edit') && (
        <FormModal title={modal === 'add' ? '➕ নতুন পণ্য যোগ' : '✏️ পণ্য সম্পাদনা'} onClose={() => setModal(null)} onSave={handleSave} saving={saving} saveLabel={modal === 'add' ? '✅ পণ্য যোগ করুন' : '💾 সংরক্ষণ করুন'}>
          <div className="input-group">
            <label className="input-label">পণ্যের নাম *</label>
            <input className="input" placeholder="যেমন: সুপার গ্লু ৫০মিলি" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          </div>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">ক্যাটাগরি</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">একক</label>
              <select className="input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          {modal === 'add' && (
            <div className="input-group">
              <label className="input-label">প্রারম্ভিক পরিমাণ</label>
              <input className="input" type="number" placeholder="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} min="0" step="any" />
            </div>
          )}
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">ক্রয় মূল্য *</label>
              <input className="input" type="number" placeholder="0.00" value={form.buy_price} onChange={e => setForm(f => ({ ...f, buy_price: e.target.value }))} min="0" step="any" />
            </div>
            <div className="input-group">
              <label className="input-label">বিক্রয় মূল্য *</label>
              <input className="input" type="number" placeholder="0.00" value={form.sell_price} onChange={e => setForm(f => ({ ...f, sell_price: e.target.value }))} min="0" step="any" />
            </div>
          </div>
          {profitPerUnit !== null && (
            <div style={{ background: profitPerUnit >= 0 ? 'var(--success-light)' : 'var(--danger-light)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: profitPerUnit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{profitPerUnit >= 0 ? '+' : ''}{fmt(profitPerUnit)}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>লাভ/একক</div>
              </div>
              {profitMargin && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: profitPerUnit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{profitMargin}%</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>মার্জিন</div>
                </div>
              )}
            </div>
          )}
          {modal === 'edit' && (
            <div className="input-group">
              <label className="input-label">স্ট্যাটাস</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="In Stock">In Stock — স্টক আছে</option>
                <option value="Low Stock">Low Stock — কম স্টক</option>
                <option value="Out of Stock">Out of Stock — স্টক শেষ</option>
                <option value="Archived">Archived — আর্কাইভ</option>
              </select>
            </div>
          )}
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><QrCode size={13} /> বারকোড / QR কোড</span>
              <button type="button" className="btn btn-xs btn-ghost" onClick={autoBarcode}>⚡ অটো তৈরি</button>
            </label>
            <input className="input" placeholder="স্ক্যান করুন বা লিখুন" value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value, product_link: e.target.value }))} />
            {form.barcode && <div style={{ marginTop: 8 }}><BarcodeVisual value={form.barcode} /></div>}
          </div>
          <div className="input-group">
            <label className="input-label">পণ্যের ছবির লিংক (ঐচ্ছিক)</label>
            <input className="input" placeholder="https://example.com/image.jpg" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
          </div>
          <div className="input-group">
            <label className="input-label">বিবরণ / নোট (ঐচ্ছিক)</label>
            <input className="input" placeholder="পণ্য সম্পর্কে তথ্য..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </FormModal>
      )}

      {modal === 'barcode' && barcodeItem && (
        <BarcodeInfoModal item={barcodeItem} onClose={() => setModal(null)} fmt={fmt} />
      )}
    </div>
  )
}
