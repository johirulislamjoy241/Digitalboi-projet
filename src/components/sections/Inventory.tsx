'use client'
import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '@/lib/app-store'
import { useApi } from '@/lib/api'
import { useToast } from '@/lib/toast-context'
import { formatCurrency, getStatusColor, UNITS, CATEGORIES } from '@/lib/utils'
import type { InventoryItem } from '@/types'

type SortKey = 'name' | 'category' | 'quantity' | 'buy_price' | 'sell_price'
type SortDir = 'asc' | 'desc'

export default function InventorySection() {
  const { inventory, setInventory, currency, lowStockThreshold } = useAppStore()
  const api = useApi()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [perPage, setPerPage] = useState(25)
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'General', quantity: '', unit: 'pcs', buy_price: '', sell_price: '', notes: '', image_url: '', product_link: '', status: 'In Stock' })

  const fmt = (v: number) => formatCurrency(v, currency)

  async function load() {
    setLoading(true)
    const data = await api.getInventory()
    setInventory(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let r = inventory
    if (search) r = r.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter) r = r.filter(i => i.status === statusFilter)
    r = [...r].sort((a, b) => {
      const va = a[sortKey] as string | number
      const vb = b[sortKey] as string | number
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
    })
    return r
  }, [inventory, search, statusFilter, sortKey, sortDir])

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.ceil(filtered.length / perPage)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function openAdd() {
    setEditItem(null)
    setForm({ name: '', category: 'General', quantity: '', unit: 'pcs', buy_price: '', sell_price: '', notes: '', image_url: '', product_link: '', status: 'In Stock' })
    setModal('add')
  }

  function openEdit(item: InventoryItem) {
    setEditItem(item)
    setForm({ name: item.name, category: item.category, quantity: String(item.quantity), unit: item.unit, buy_price: String(item.buy_price), sell_price: String(item.sell_price), notes: item.notes || '', image_url: item.image_url || '', product_link: item.product_link || '', status: item.status })
    setModal('edit')
  }

  async function handleSave() {
    if (!form.name) return toast('Product name is required', 'er')
    setSaving(true)
    try {
      const payload = {
        name: form.name, category: form.category, unit: form.unit,
        buy_price: parseFloat(form.buy_price) || 0,
        sell_price: parseFloat(form.sell_price) || 0,
        notes: form.notes, image_url: form.image_url, product_link: form.product_link,
        ...(modal === 'add' ? { quantity: parseFloat(form.quantity) || 0 } : { status: form.status as 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Archived' })
      }
      if (modal === 'edit' && editItem) {
        const updated = await api.updateProduct(editItem.id, payload)
        setInventory(inventory.map(i => i.id === editItem.id ? { ...i, ...updated } : i))
        toast('Product updated ✅', 'ok')
      } else {
        const created = await api.addProduct(payload)
        setInventory([created, ...inventory])
        toast('Product added ✅', 'ok')
      }
      setModal(null)
    } catch (e: unknown) {
      toast((e as Error).message || 'Failed to save', 'er')
    }
    setSaving(false)
  }

  async function handleDelete(item: InventoryItem) {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    try {
      await api.deleteProduct(item.id)
      setInventory(inventory.filter(i => i.id !== item.id))
      toast('Product deleted', 'wa')
    } catch (e: unknown) {
      toast((e as Error).message || 'Failed to delete', 'er')
    }
  }

  async function handleArchive(item: InventoryItem) {
    const newStatus = item.status === 'Archived' ? 'In Stock' : 'Archived'
    try {
      const updated = await api.updateProduct(item.id, { status: newStatus })
      setInventory(inventory.map(i => i.id === item.id ? { ...i, ...updated } : i))
      toast(`Product ${newStatus === 'Archived' ? 'archived' : 'restored'}`, 'in')
    } catch {}
  }

  const SortIcon = ({ k }: { k: SortKey }) => (
    <i className={`fas fa-sort${sortKey === k ? (sortDir === 'asc' ? '-up' : '-down') : ''}`} style={{ marginLeft: 4, fontSize: '.7rem', color: sortKey === k ? 'var(--a1)' : 'var(--mt)' }} />
  )

  return (
    <div className="section active" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card card-pad">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Full Inventory</div>
            <div style={{ fontSize: '.72rem', color: 'var(--mt)', marginTop: 2 }}>{filtered.length} products</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', minWidth: 140, flex: 1 }}>
              <i className="fas fa-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--mt)', fontSize: '.75rem', pointerEvents: 'none' }} />
              <input className="field" style={{ paddingLeft: 28, fontSize: '.82rem', padding: '8px 8px 8px 28px' }} placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
            <select className="field" style={{ width: 130, fontSize: '.82rem', padding: '8px 10px' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
              <option value="">All Status</option>
              <option>In Stock</option><option>Low Stock</option><option>Out of Stock</option><option value="Archived">🗄 Archived</option>
            </select>
            <select className="field" style={{ width: 95, fontSize: '.82rem', padding: '8px 10px' }} value={perPage} onChange={e => { setPerPage(parseInt(e.target.value)); setPage(1) }}>
              <option value={10}>10/page</option><option value={25}>25/page</option><option value={50}>50/page</option><option value={100}>100/page</option>
            </select>
            <button className="btn btn-p btn-sm" onClick={openAdd}><i className="fas fa-plus" /> Add New</button>
          </div>
        </div>

        {/* Table */}
        <div className="tbl-wrap">
          <table className="tbl" style={{ minWidth: 750 }}>
            <thead><tr>
              <th style={{ width: 36 }}>#</th>
              <th className="srt" onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }}>Product <SortIcon k="name" /></th>
              <th className="srt" onClick={() => toggleSort('category')} style={{ cursor: 'pointer' }}>Category <SortIcon k="category" /></th>
              <th className="srt" onClick={() => toggleSort('quantity')} style={{ cursor: 'pointer' }}>Qty <SortIcon k="quantity" /></th>
              <th>Unit</th>
              <th className="srt" onClick={() => toggleSort('buy_price')} style={{ cursor: 'pointer' }}>Buy <SortIcon k="buy_price" /></th>
              <th className="srt" onClick={() => toggleSort('sell_price')} style={{ cursor: 'pointer' }}>Sell <SortIcon k="sell_price" /></th>
              <th>Value</th>
              <th>P/Unit</th>
              <th>Status</th>
              <th style={{ width: 90 }}>Actions</th>
            </tr></thead>
            <tbody>
              {loading && <tr><td colSpan={11} style={{ textAlign: 'center', padding: 28 }}><span className="spin" /> Loading...</td></tr>}
              {!loading && paginated.length === 0 && <tr><td colSpan={11} style={{ textAlign: 'center', padding: 28, color: 'var(--mt)' }}>No products found</td></tr>}
              {paginated.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ color: 'var(--mt)', fontSize: '.75rem' }}>{(page - 1) * perPage + idx + 1}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    {item.notes && <div style={{ fontSize: '.68rem', color: 'var(--mt)' }}>{item.notes.substring(0, 40)}</div>}
                  </td>
                  <td><span style={{ background: 'rgba(99,102,241,.08)', color: 'var(--a1)', padding: '2px 8px', borderRadius: 20, fontSize: '.7rem', fontWeight: 600 }}>{item.category}</span></td>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace', color: item.quantity === 0 ? 'var(--a3)' : item.quantity <= lowStockThreshold ? 'var(--a4)' : 'var(--tx)' }}>{item.quantity}</td>
                  <td style={{ color: 'var(--tx2)', fontSize: '.8rem' }}>{item.unit}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '.82rem' }}>{fmt(item.buy_price)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '.82rem' }}>{fmt(item.sell_price)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '.82rem', color: 'var(--a4)' }}>{fmt(item.quantity * item.buy_price)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '.82rem', color: item.profit >= 0 ? 'var(--a2)' : 'var(--a3)' }}>{item.profit >= 0 ? '+' : ''}{fmt(item.profit)}</td>
                  <td><span className={`badge ${getStatusColor(item.status)}`} style={{ fontSize: '.68rem' }}>{item.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-g btn-xs" title="Edit" onClick={() => openEdit(item)}><i className="fas fa-edit" /></button>
                      <button className="btn btn-xs" title={item.status === 'Archived' ? 'Restore' : 'Archive'} style={{ background: 'rgba(245,158,11,.1)', color: 'var(--a4)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 7 }} onClick={() => handleArchive(item)}>
                        <i className={`fas fa-${item.status === 'Archived' ? 'undo' : 'archive'}`} />
                      </button>
                      <button className="btn btn-r btn-xs" title="Delete" onClick={() => handleDelete(item)}><i className="fas fa-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagi">
            <span className="pagi-info">{filtered.length} items · Page {page} of {totalPages}</span>
            <div className="pagi-btns">
              <button className="pb" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`pb ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="pb" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-hd">
              <h3 style={{ fontWeight: 700, fontSize: '.97rem' }}>{modal === 'add' ? '➕ Add New Product' : '✏️ Edit Product'}</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'var(--tx2)', cursor: 'pointer', fontSize: '1.1rem' }}><i className="fas fa-times" /></button>
            </div>
            <div className="modal-bd">
              <div className="fg"><label>Product Name *</label><input className="field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Samsung Galaxy A54" /></div>
              <div className="g2">
                <div className="fg"><label>Category</label>
                  <select className="field" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="fg"><label>Unit</label>
                  <select className="field" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} disabled={modal === 'edit'} title={modal === 'edit' ? 'Unit cannot be changed after creation' : ''}>
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              {modal === 'add' && (
                <div className="fg"><label>Initial Quantity</label>
                  <input className="field" type="number" min="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" />
                </div>
              )}
              <div className="g2">
                <div className="fg"><label>Buy Price</label><input className="field" type="number" min="0" step="0.01" value={form.buy_price} onChange={e => setForm(f => ({ ...f, buy_price: e.target.value }))} placeholder="0.00" /></div>
                <div className="fg"><label>Sell Price</label><input className="field" type="number" min="0" step="0.01" value={form.sell_price} onChange={e => setForm(f => ({ ...f, sell_price: e.target.value }))} placeholder="0.00" /></div>
              </div>
              {modal === 'edit' && (
                <div className="fg"><label>Status</label>
                  <select className="field" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option>In Stock</option><option>Low Stock</option><option>Out of Stock</option><option>Archived</option>
                  </select>
                </div>
              )}
              {/* Profit preview */}
              {form.buy_price && form.sell_price && (
                <div style={{ background: 'var(--bg4)', borderRadius: 9, padding: '10px 14px', fontSize: '.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--tx2)' }}>Profit per unit:</span>
                    <strong style={{ color: (parseFloat(form.sell_price) - parseFloat(form.buy_price)) >= 0 ? 'var(--a2)' : 'var(--a3)', fontFamily: 'monospace' }}>
                      {fmt(parseFloat(form.sell_price) - parseFloat(form.buy_price))}
                    </strong>
                  </div>
                </div>
              )}
              <div className="fg"><label>Notes</label><textarea className="field" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." style={{ resize: 'vertical' }} /></div>
              <div className="fg"><label>Image URL</label><input className="field" type="url" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></div>
              <div className="fg"><label>Product Link</label><input className="field" type="url" value={form.product_link} onChange={e => setForm(f => ({ ...f, product_link: e.target.value }))} placeholder="https://..." /></div>
              <button className="btn btn-p btn-full" onClick={handleSave} disabled={saving} style={{ marginTop: 4 }}>
                {saving ? <><span className="spin" /> Saving...</> : <><i className="fas fa-check" /> {modal === 'add' ? 'Add Product' : 'Save Changes'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
