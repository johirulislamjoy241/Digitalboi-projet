'use client'
import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '@/lib/app-store'
import { useApi } from '@/lib/api'
import { useToast } from '@/lib/toast-context'
import { formatCurrency, UNITS, CATEGORIES } from '@/lib/utils'
import type { InventoryItem } from '@/types'
import { Search, Plus, Edit2, Trash2, Archive, ChevronLeft, ChevronRight, QrCode, RefreshCw, TrendingUp, Package } from 'lucide-react'

type SK = 'name' | 'category' | 'quantity' | 'buy_price' | 'sell_price'

const CAT_EMOJI: Record<string, string> = {
  Electronics: '⚡', Clothing: '👕', 'Food & Beverage': '🍎', Furniture: '🪑',
  Books: '📚', Stationery: '✏️', Medicine: '💊', Cosmetics: '💄',
  Hardware: '🔧', Toys: '🎮', Sports: '⚽', Automotive: '🚗',
  Agriculture: '🌾', General: '📦'
}

function getStatusBadge(status: string) {
  if (status === 'In Stock') return <span className="badge badge-success">✓ আছে</span>
  if (status === 'Low Stock') return <span className="badge badge-warning">⚠ কম</span>
  if (status === 'Out of Stock') return <span className="badge badge-danger">✕ শেষ</span>
  return <span className="badge badge-neutral">📦 আর্কাইভ</span>
}

// Simple QR/barcode value generator
function generateBarcode(name: string): string {
  const ts = Date.now().toString(36).toUpperCase()
  const prefix = name.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase() || 'PRD'
  return `${prefix}-${ts}`
}

// Draw a simple barcode using canvas (Code128-like visual)
function BarcodeDisplay({ value }: { value: string }) {
  if (!value) return null
  return (
    <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: 10, border: '1px solid var(--border)' }}>
      {/* Visual barcode bars */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 1, height: 48, marginBottom: 6 }}>
        {value.split('').map((char, i) => {
          const code = char.charCodeAt(0)
          const widths = [2, 1, 3, 1, 2, 1, 3, 2, 1, 2]
          const w = widths[(code + i) % widths.length]
          return (
            <div key={i} style={{ width: w * 2, background: '#000', height: '100%', borderRadius: 1 }} />
          )
        })}
      </div>
      <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', letterSpacing: '0.1em', color: '#333', userSelect: 'all' }}>
        {value}
      </div>
    </div>
  )
}

export default function InventorySection() {
  const { inventory, setInventory, currency, lowStockThreshold } = useAppStore()
  const api = useApi()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [perPage] = useState(20)
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<SK>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let r = inventory
    if (search) r = r.filter(i =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
    )
    if (statusFilter) r = r.filter(i => i.status === statusFilter)
    return [...r].sort((a, b) => {
      const va = a[sortKey] as string | number
      const vb = b[sortKey] as string | number
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
    })
  }, [inventory, search, statusFilter, sortKey, sortDir])

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.ceil(filtered.length / perPage)

  // Computed profit margin
  const profitMargin = form.buy_price && form.sell_price
    ? (((parseFloat(form.sell_price) - parseFloat(form.buy_price)) / parseFloat(form.buy_price)) * 100).toFixed(1)
    : null
  const profitPerUnit = form.buy_price && form.sell_price
    ? parseFloat(form.sell_price) - parseFloat(form.buy_price)
    : null
  const totalValue = form.quantity && form.buy_price
    ? parseFloat(form.quantity) * parseFloat(form.buy_price)
    : null

  function openAdd() {
    setEditItem(null)
    setForm({ name: '', category: 'General', quantity: '', unit: 'pcs', buy_price: '', sell_price: '', notes: '', image_url: '', product_link: '', status: 'In Stock', barcode: '' })
    setModal('add')
  }

  function openEdit(item: InventoryItem) {
    setEditItem(item)
    setForm({
      name: item.name, category: item.category,
      quantity: String(item.quantity), unit: item.unit,
      buy_price: String(item.buy_price), sell_price: String(item.sell_price),
      notes: item.notes || '', image_url: item.image_url || '',
      product_link: item.product_link || '', status: item.status,
      barcode: item.product_link || ''
    })
    setModal('edit')
  }

  function autoBarcode() {
    const code = generateBarcode(form.name || 'PRD')
    setForm(f => ({ ...f, barcode: code, product_link: code }))
    toast('বারকোড তৈরি হয়েছে ✅', 'ok')
  }

  async function handleSave() {
    if (!form.name.trim()) return toast('পণ্যের নাম দিন', 'er')
    const bp = parseFloat(form.buy_price)
    const sp = parseFloat(form.sell_price)
    const qty = parseFloat(form.quantity)
    if (isNaN(bp) || bp < 0) return toast('সঠিক ক্রয় মূল্য দিন', 'er')
    if (isNaN(sp) || sp < 0) return toast('সঠিক বিক্রয় মূল্য দিন', 'er')
    if (modal === 'add' && (isNaN(qty) || qty < 0)) return toast('সঠিক পরিমাণ দিন', 'er')

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        unit: form.unit,
        buy_price: bp,
        sell_price: sp,
        notes: form.notes,
        image_url: form.image_url,
        product_link: form.barcode || form.product_link,
        ...(modal === 'add' ? { quantity: qty } : { status: form.status as InventoryItem['status'] })
      }
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
    try {
      await api.deleteProduct(item.id)
      setInventory(inventory.filter(i => i.id !== item.id))
      toast('মুছে ফেলা হয়েছে', 'wa')
    } catch (e: unknown) { toast((e as Error).message || 'সমস্যা', 'er') }
  }

  async function handleArchive(item: InventoryItem) {
    const ns = item.status === 'Archived' ? 'In Stock' : 'Archived'
    try {
      const u = await api.updateProduct(item.id, { status: ns })
      setInventory(inventory.map(i => i.id === item.id ? { ...i, ...u } : i))
      toast(ns === 'Archived' ? 'আর্কাইভ হয়েছে' : 'পুনরুদ্ধার হয়েছে', 'in')
    } catch { /* ignore */ }
  }

  const STATUS_FILTERS = ['', 'In Stock', 'Low Stock', 'Out of Stock', 'Archived']
  const STATUS_LABELS: Record<string, string> = {
    '': 'সব', 'In Stock': '✓ স্টক', 'Low Stock': '⚠ কম', 'Out of Stock': '✕ শেষ', 'Archived': '📦 আর্কাইভ'
  }

  // Summary stats
  const stats = useMemo(() => {
    const active = inventory.filter(i => i.status !== 'Archived')
    return {
      total: active.length,
      value: active.reduce((s, i) => s + i.quantity * i.buy_price, 0),
      low: active.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock').length,
    }
  }, [inventory])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }} className="anim-fade-up">
        {[
          { label: 'মোট পণ্য', value: stats.total, color: 'var(--info)', bg: 'var(--info-light)' },
          { label: 'স্টক মূল্য', value: fmt(stats.value), color: 'var(--primary)', bg: 'var(--primary-bg)', mono: true },
          { label: 'সতর্কতা', value: stats.low, color: stats.low > 0 ? 'var(--danger)' : 'var(--success)', bg: stats.low > 0 ? 'var(--danger-light)' : 'var(--success-light)' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontFamily: s.mono ? 'var(--font-mono)' : 'var(--font-bn)', fontWeight: 700, fontSize: '0.88rem', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Header with search */}
      <div className="card card-p anim-fade-up anim-d1">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div className="section-title">ইনভেন্টরি</div>
            <div className="section-subtitle">{filtered.length} টি পণ্য</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={load} title="রিফ্রেশ">
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
            </button>
            <button className="btn btn-primary btn-sm" onClick={openAdd}>
              <Plus size={16} /> যোগ
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="search-bar" style={{ marginBottom: 10 }}>
          <Search size={15} color="var(--text3)" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="পণ্যের নাম বা ক্যাটাগরি খুঁজুন..." />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 0 }}>✕</button>}
        </div>

        {/* Status filters */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
          {STATUS_FILTERS.map(s => (
            <button key={s} className={`chip ${statusFilter === s ? 'active' : ''}`} style={{ flexShrink: 0 }} onClick={() => { setStatusFilter(s); setPage(1) }}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && [1, 2, 3, 4].map(i => (
        <div key={i} className="card card-p" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 13, marginBottom: 8, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 10, width: '55%', borderRadius: 6 }} />
          </div>
          <div style={{ width: 60 }}>
            <div className="skeleton" style={{ height: 13, marginBottom: 6, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 18, borderRadius: 8 }} />
          </div>
        </div>
      ))}

      {/* Empty state */}
      {!loading && paginated.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-title">কোনো পণ্য পাওয়া যায়নি</div>
            <div className="empty-sub">ফিল্টার পরিবর্তন করুন বা নতুন পণ্য যোগ করুন</div>
            <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14} /> নতুন পণ্য যোগ করুন</button>
          </div>
        </div>
      )}

      {/* Product list */}
      {!loading && paginated.map((item, idx) => (
        <div key={item.id} className="product-card anim-fade-up" style={{ animationDelay: `${idx * 0.03}s` }}>
          <div className="product-img">
            {item.image_url
              ? <img src={item.image_url} alt={item.name} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              : <span>{CAT_EMOJI[item.category] || '📦'}</span>
            }
          </div>
          <div className="product-info">
            <div className="product-name">{item.name}</div>
            <div className="product-category">{item.category} · {item.quantity} {item.unit}</div>
            <div style={{ marginTop: 5, display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
              {getStatusBadge(item.status)}
              <span style={{ fontSize: '0.62rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>
                লাভ: {fmt(item.sell_price - item.buy_price)}/একক
              </span>
            </div>
          </div>
          <div className="product-meta">
            <div className="product-price">{fmt(item.sell_price)}</div>
            <div className="text-xs text-muted mono">ক্রয়: {fmt(item.buy_price)}</div>
            <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {item.product_link && (
                <button className="btn btn-xs btn-ghost" style={{ padding: '4px 6px' }} onClick={() => { setBarcodeItem(item); setModal('barcode') }} title="বারকোড দেখুন">
                  <QrCode size={12} />
                </button>
              )}
              <button className="btn btn-xs btn-ghost" style={{ padding: '4px 8px' }} onClick={() => openEdit(item)}><Edit2 size={12} /></button>
              <button className="btn btn-xs btn-ghost" style={{ padding: '4px 8px' }} onClick={() => handleArchive(item)} title={item.status === 'Archived' ? 'পুনরুদ্ধার' : 'আর্কাইভ'}><Archive size={12} /></button>
              <button className="btn btn-xs btn-danger" style={{ padding: '4px 8px' }} onClick={() => handleDelete(item)}><Trash2 size={12} /></button>
            </div>
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '8px 0' }}>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-muted">{page} / {totalPages} ({filtered.length} পণ্য)</span>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ── ADD / EDIT MODAL ── */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '94dvh', overflowY: 'auto' }}>
            <div className="modal-handle" />
            <div className="modal-title">{modal === 'add' ? '➕ নতুন পণ্য যোগ' : '✏️ পণ্য সম্পাদনা'}</div>

            {/* Name */}
            <div className="input-group">
              <label className="input-label">পণ্যের নাম *</label>
              <input className="input" placeholder="যেমন: সুপার গ্লু ৫০মিলি" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>

            {/* Category + Unit */}
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

            {/* Quantity (add only) */}
            {modal === 'add' && (
              <div className="input-group">
                <label className="input-label">প্রারম্ভিক পরিমাণ</label>
                <input className="input" type="number" placeholder="0" value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} min="0" step="any" />
              </div>
            )}

            {/* Buy + Sell price */}
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">ক্রয় মূল্য *</label>
                <input className="input" type="number" placeholder="0.00" value={form.buy_price}
                  onChange={e => setForm(f => ({ ...f, buy_price: e.target.value }))} min="0" step="any" />
              </div>
              <div className="input-group">
                <label className="input-label">বিক্রয় মূল্য *</label>
                <input className="input" type="number" placeholder="0.00" value={form.sell_price}
                  onChange={e => setForm(f => ({ ...f, sell_price: e.target.value }))} min="0" step="any" />
              </div>
            </div>

            {/* Profit calculation preview */}
            {profitPerUnit !== null && (
              <div style={{
                background: profitPerUnit >= 0 ? 'var(--success-light)' : 'var(--danger-light)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 14,
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: profitPerUnit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {profitPerUnit >= 0 ? '+' : ''}{fmt(profitPerUnit)}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>লাভ/একক</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: profitPerUnit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {profitMargin}%
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>মার্জিন</div>
                </div>
                {totalValue !== null && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)' }}>
                      {fmt(totalValue)}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>মোট মূল্য</div>
                  </div>
                )}
              </div>
            )}

            {/* Status (edit only) */}
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

            {/* Barcode section */}
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><QrCode size={13} /> বারকোড / QR কোড</span>
                <button type="button" className="btn btn-xs btn-ghost" onClick={autoBarcode} style={{ fontSize: '0.68rem' }}>
                  ⚡ অটো তৈরি
                </button>
              </label>
              <input className="input" placeholder="বারকোড স্ক্যান করুন বা ম্যানুয়ালি লিখুন"
                value={form.barcode}
                onChange={e => setForm(f => ({ ...f, barcode: e.target.value, product_link: e.target.value }))}
              />
              {form.barcode && (
                <div style={{ marginTop: 8 }}>
                  <BarcodeDisplay value={form.barcode} />
                </div>
              )}
            </div>

            {/* Image URL */}
            <div className="input-group">
              <label className="input-label">পণ্যের ছবির লিংক (ঐচ্ছিক)</label>
              <input className="input" placeholder="https://example.com/image.jpg"
                value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
            </div>

            {/* Notes */}
            <div className="input-group">
              <label className="input-label">নোট (ঐচ্ছিক)</label>
              <input className="input" placeholder="পণ্য সম্পর্কে অতিরিক্ত তথ্য..."
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setModal(null)}>বাতিল</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
                {saving
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />
                      সংরক্ষণ হচ্ছে...
                    </span>
                  : modal === 'add' ? '✅ পণ্য যোগ করুন' : '💾 পরিবর্তন সংরক্ষণ করুন'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BARCODE VIEW MODAL ── */}
      {modal === 'barcode' && barcodeItem && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">🔍 বারকোড — {barcodeItem.name}</div>
            <BarcodeDisplay value={barcodeItem.product_link || ''} />
            <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)', textAlign: 'center' }}>
              এই কোডটি POS স্ক্যানারে স্ক্যান করা যাবে
            </div>
            <button className="btn btn-ghost btn-full" style={{ marginTop: 14 }} onClick={() => setModal(null)}>বন্ধ করুন</button>
          </div>
        </div>
      )}
    </div>
  )
}
