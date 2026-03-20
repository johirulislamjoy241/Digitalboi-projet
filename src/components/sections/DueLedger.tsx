'use client'
import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '@/lib/app-store'
import { useApi } from '@/lib/api'
import { useToast } from '@/lib/toast-context'
import { formatCurrency, formatDateShort, UNITS } from '@/lib/utils'
import type { DueLedgerEntry, Buyer, InventoryItem } from '@/types'

type DueTab = 'all' | 'pending' | 'partial' | 'overdue' | 'paid' | 'buyers'

export default function DueLedgerSection() {
  const { dueLedger, setDueLedger, buyers, setBuyers, inventory, setInventory, currency } = useAppStore()
  const api = useApi()
  const { toast } = useToast()

  const [tab, setTab] = useState<DueTab>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | 'payment' | 'buyer' | null>(null)
  const [editEntry, setEditEntry] = useState<DueLedgerEntry | null>(null)
  const [editBuyer, setEditBuyer] = useState<Buyer | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
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
  useEffect(() => { load() }, []) // run once on mount

  // Summary stats
  const summary = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    let total = 0, pending = 0, partial = 0, paid = 0, overdue = 0
    dueLedger.forEach(e => {
      total += e.remaining
      if (e.status === 'Pending') {
        pending += e.remaining
        if (e.due_date && new Date(e.due_date) < today) overdue += e.remaining
      }
      if (e.status === 'Partial') { partial += e.remaining; if (e.due_date && new Date(e.due_date) < today) overdue += e.remaining }
      if (e.status === 'Paid') paid += e.total_amount
    })
    return { total, pending, partial, paid, overdue }
  }, [dueLedger])

  // Filter entries
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

  const totalCalc = (parseFloat(dueForm.qty) || 0) * (parseFloat(dueForm.unitPrice) || 0)

  // Due status badge
  function dueBadge(entry: DueLedgerEntry) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    if ((entry.status === 'Pending' || entry.status === 'Partial') && entry.due_date && new Date(entry.due_date) < today)
      return <span className="due-badge due-overdue"><i className="fas fa-exclamation-circle" /> Overdue</span>
    const map: Record<string, JSX.Element> = {
      'Pending': <span className="due-badge due-pending"><i className="fas fa-clock" /> Pending</span>,
      'Partial': <span className="due-badge due-partial"><i className="fas fa-adjust" /> Partial</span>,
      'Paid':    <span className="due-badge due-paid"><i className="fas fa-check-circle" /> Paid</span>,
    }
    return map[entry.status] || <span className="due-badge">{entry.status}</span>
  }

  async function handleAddDue() {
    if (!selBuyer) return toast('Please select a buyer', 'er')
    if (!dueForm.unitPrice || !dueForm.qty) return toast('Quantity and price are required', 'er')
    setSaving(true)
    try {
      const entry = await api.addDueEntry({
        buyer_id: selBuyer.id, buyer_name: selBuyer.name,
        product_id: selProduct?.id, product_name: selProduct?.name,
        quantity: parseFloat(dueForm.qty), unit: dueForm.unit,
        unit_price: parseFloat(dueForm.unitPrice),
        total_amount: totalCalc,
        paid_amount: parseFloat(dueForm.paidAmount) || 0,
        due_date: dueForm.dueDate || undefined,
        notes: dueForm.notes,
      })
      setDueLedger([entry, ...dueLedger])
      setModal(null)
      resetDueForm()
      toast('Due sale recorded ✅', 'ok')
    } catch (e: unknown) { toast((e as Error).message || 'Failed', 'er') }
    setSaving(false)
  }

  async function handlePayment() {
    if (!editEntry) return
    const paid = parseFloat(payAmount) || 0
    const newPaid = editEntry.paid_amount + paid
    setSaving(true)
    try {
      const updated = await api.updateDueEntry(editEntry.id, { paid_amount: newPaid })
      setDueLedger(dueLedger.map(e => e.id === editEntry.id ? { ...e, ...updated } : e))
      setModal(null)
      toast('Payment recorded ✅', 'ok')
    } catch (e: unknown) { toast((e as Error).message || 'Failed', 'er') }
    setSaving(false)
  }

  async function handleDeleteDue(id: string) {
    if (!confirm('Delete this due entry?')) return
    try {
      await api.deleteDueEntry(id)
      setDueLedger(dueLedger.filter(e => e.id !== id))
      toast('Deleted', 'wa')
    } catch {}
  }

  async function handleSaveBuyer() {
    if (!buyerForm.name) return toast('Buyer name is required', 'er')
    setSaving(true)
    try {
      if (editBuyer) {
        const updated = await api.updateBuyer(editBuyer.id, buyerForm)
        setBuyers(buyers.map(b => b.id === editBuyer.id ? { ...b, ...updated } : b))
        toast('Buyer updated ✅', 'ok')
      } else {
        const created = await api.addBuyer(buyerForm)
        setBuyers([...buyers, created])
        toast('Buyer added ✅', 'ok')
      }
      setModal(null)
      setBuyerForm({ name: '', phone: '', email: '', address: '', notes: '' })
      setEditBuyer(null)
    } catch (e: unknown) { toast((e as Error).message || 'Failed', 'er') }
    setSaving(false)
  }

  async function handleDeleteBuyer(id: string) {
    if (!confirm('Delete this buyer?')) return
    try { await api.deleteBuyer(id); setBuyers(buyers.filter(b => b.id !== id)); toast('Deleted', 'wa') } catch {}
  }

  function resetDueForm() {
    setSelBuyer(null); setSelProduct(null)
    setBuyerSearch(''); setProdSearch('')
    setDueForm({ qty: '', unit: 'pcs', unitPrice: '', paidAmount: '0', dueDate: '', notes: '' })
  }

  function openPayment(entry: DueLedgerEntry) { setEditEntry(entry); setPayAmount(''); setModal('payment') }

  return (
    <div className="section active" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Summary bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
        {[
          { label: 'Total Due', value: fmt(summary.total), color: 'var(--a3)' },
          { label: 'Pending', value: fmt(summary.pending), color: 'var(--a4)' },
          { label: 'Partial', value: fmt(summary.partial), color: 'var(--a1)' },
          { label: 'Fully Paid', value: fmt(summary.paid), color: 'var(--a2)' },
          { label: 'Overdue', value: fmt(summary.overdue), color: 'var(--a3)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '.65rem', color: 'var(--mt)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'monospace', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {(['all','pending','partial','overdue','paid','buyers'] as DueTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.78rem', fontWeight: 600, background: tab === t ? 'var(--a1)' : 'rgba(255,255,255,.05)', color: tab === t ? '#fff' : 'var(--tx2)', transition: 'all .15s' }}>
            {t === 'buyers' ? '👤 Buyer Profiles' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <button className="btn btn-p btn-sm" style={{ marginLeft: 'auto' }} onClick={() => { resetDueForm(); setModal('add') }}>
          <i className="fas fa-plus" /> New Due Sale
        </button>
      </div>

      {/* Records view */}
      {tab !== 'buyers' && (
        <div className="card card-pad">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '.95rem' }}>Due Ledger — বাকি খাতা</div>
              <div style={{ fontSize: '.72rem', color: 'var(--mt)', marginTop: 2 }}>{displayEntries.length} records</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="field" style={{ width: 200, fontSize: '.82rem', padding: '7px 10px' }} placeholder="Search buyer / product..." value={search} onChange={e => setSearch(e.target.value)} />
              <button className="btn btn-g btn-sm" onClick={load}><i className="fas fa-sync-alt" /></button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl" style={{ minWidth: 750 }}>
              <thead><tr>
                <th>Buyer</th><th>Product</th><th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Paid</th><th style={{ textAlign: 'right' }}>Remaining</th>
                <th>Status</th><th>Due Date</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {loading && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 28 }}><span className="spin" /></td></tr>}
                {!loading && displayEntries.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 28, color: 'var(--mt)' }}>No records found</td></tr>}
                {displayEntries.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600 }}>{e.buyer_name}</td>
                    <td style={{ color: 'var(--tx2)' }}>{e.product_name || '—'}{e.quantity ? ` (${e.quantity} ${e.unit})` : ''}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(e.total_amount)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--a2)' }}>{fmt(e.paid_amount)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: e.remaining > 0 ? 'var(--a3)' : 'var(--a2)' }}>{fmt(e.remaining)}</td>
                    <td>{dueBadge(e)}</td>
                    <td style={{ fontSize: '.78rem', color: 'var(--mt)' }}>{e.due_date ? formatDateShort(e.due_date) : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {e.status !== 'Paid' && (
                          <button className="btn btn-sm" style={{ background: 'rgba(16,185,129,.1)', color: 'var(--a2)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 7, padding: '4px 8px', fontSize: '.7rem' }} onClick={() => openPayment(e)}>
                            <i className="fas fa-money-bill-wave" /> Pay
                          </button>
                        )}
                        <button className="btn btn-r btn-xs" onClick={() => handleDeleteDue(e.id)}><i className="fas fa-trash" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Buyers view */}
      {tab === 'buyers' && (
        <div className="card card-pad">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: '.95rem' }}>Buyer Profiles ({buyers.length})</div>
            <button className="btn btn-p btn-sm" onClick={() => { setEditBuyer(null); setBuyerForm({ name: '', phone: '', email: '', address: '', notes: '' }); setModal('buyer') }}>
              <i className="fas fa-user-plus" /> Add Buyer
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 10 }}>
            {buyers.map(b => (
              <div key={b.id} style={{ background: 'var(--bg4)', border: '1px solid var(--bdr)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700 }}>{b.name}</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-g btn-xs" onClick={() => { setEditBuyer(b); setBuyerForm({ name: b.name, phone: b.phone || '', email: b.email || '', address: b.address || '', notes: b.notes || '' }); setModal('buyer') }}><i className="fas fa-edit" /></button>
                    <button className="btn btn-r btn-xs" onClick={() => handleDeleteBuyer(b.id)}><i className="fas fa-trash" /></button>
                  </div>
                </div>
                {b.phone && <div style={{ fontSize: '.78rem', color: 'var(--tx2)' }}><i className="fas fa-phone" style={{ marginRight: 6, color: 'var(--mt)' }} />{b.phone}</div>}
                {b.email && <div style={{ fontSize: '.78rem', color: 'var(--tx2)', marginTop: 3 }}><i className="fas fa-envelope" style={{ marginRight: 6, color: 'var(--mt)' }} />{b.email}</div>}
                {b.address && <div style={{ fontSize: '.78rem', color: 'var(--tx2)', marginTop: 3 }}><i className="fas fa-map-marker-alt" style={{ marginRight: 6, color: 'var(--mt)' }} />{b.address}</div>}
                <div style={{ marginTop: 8, fontSize: '.7rem', color: 'var(--mt)' }}>
                  Total due: <strong style={{ color: 'var(--a3)', fontFamily: 'monospace' }}>
                    {fmt(dueLedger.filter(e => e.buyer_id === b.id && e.status !== 'Paid').reduce((s, e) => s + e.remaining, 0))}
                  </strong>
                </div>
              </div>
            ))}
            {buyers.length === 0 && !loading && <div style={{ color: 'var(--mt)', fontSize: '.85rem', gridColumn: '1/-1', textAlign: 'center', padding: 24 }}>No buyers yet. Add your first buyer!</div>}
          </div>
        </div>
      )}

      {/* ── Add Due Modal ── */}
      {modal === 'add' && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-hd">
              <h3 style={{ fontWeight: 700, fontSize: '.97rem' }}>New Due Sale — বাকি বিক্রি</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'var(--tx2)', cursor: 'pointer', fontSize: '1.1rem' }}><i className="fas fa-times" /></button>
            </div>
            <div className="modal-bd">
              {/* Buyer search */}
              <div className="fg">
                <label>Buyer Name *</label>
                {buyers.length === 0
                  ? <div style={{ background: 'rgba(244,63,94,.08)', border: '1px solid rgba(244,63,94,.25)', borderRadius: 8, padding: '10px 14px', color: 'var(--a3)', fontSize: '.78rem' }}>
                      <i className="fas fa-exclamation-triangle" /> No buyers found. <button type="button" style={{ background: 'none', border: 'none', color: 'var(--a1)', cursor: 'pointer', textDecoration: 'underline', fontSize: 'inherit' }} onClick={() => setModal('buyer')}>Add a buyer first</button>
                    </div>
                  : <div className="sd-wrap">
                      <div className="sd-iw">
                        <i className="fas fa-user sd-ico" />
                        <input className="field sd-inp" value={buyerSearch} onChange={e => { setBuyerSearch(e.target.value); setShowBuyerDd(true) }} onFocus={() => setShowBuyerDd(true)} onBlur={() => setTimeout(() => setShowBuyerDd(false), 200)} placeholder="Search from Buyer Profiles..." autoComplete="off" />
                        {selBuyer && <button className="sd-clr" style={{ display: 'block' }} onClick={() => { setSelBuyer(null); setBuyerSearch('') }}><i className="fas fa-times" /></button>}
                      </div>
                      {showBuyerDd && (
                        <div className="sd-dd open">
                          {filteredBuyers.length === 0 ? <div className="sd-empty">No buyers found</div>
                            : filteredBuyers.map(b => (
                              <div key={b.id} className="sd-it" onMouseDown={() => { setSelBuyer(b); setBuyerSearch(b.name); setShowBuyerDd(false) }}>
                                <span>{b.name}</span>
                                <span style={{ fontSize: '.72rem', color: 'var(--mt)' }}>{b.phone}</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                }
              </div>

              {/* Product search */}
              <div className="fg">
                <label>Product (optional)</label>
                <div className="sd-wrap">
                  <div className="sd-iw">
                    <i className="fas fa-search sd-ico" />
                    <input className="field sd-inp" value={prodSearch} onChange={e => { setProdSearch(e.target.value); setShowProdDd(true) }} onFocus={() => setShowProdDd(true)} onBlur={() => setTimeout(() => setShowProdDd(false), 200)} placeholder="Search product from inventory..." autoComplete="off" />
                    {selProduct && <button className="sd-clr" style={{ display: 'block' }} onClick={() => { setSelProduct(null); setProdSearch('') }}><i className="fas fa-times" /></button>}
                  </div>
                  {showProdDd && (
                    <div className="sd-dd open">
                      {filteredProds.length === 0 ? <div className="sd-empty">No products</div>
                        : filteredProds.map(p => (
                          <div key={p.id} className="sd-it" onMouseDown={() => {
                            setSelProduct(p); setProdSearch(p.name); setShowProdDd(false)
                            setDueForm(f => ({ ...f, unit: p.unit, unitPrice: String(p.sell_price) }))
                          }}>
                            <span>{p.name}</span>
                            <span style={{ fontSize: '.72rem', color: 'var(--a2)', fontFamily: 'monospace' }}>{p.quantity} {p.unit}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="g2">
                <div className="fg">
                  <label>Quantity *</label>
                  <div className="qty-wrap">
                    <input className="field" type="number" min="0" value={dueForm.qty} onChange={e => setDueForm(f => ({ ...f, qty: e.target.value }))} placeholder="0" />
                    <select className="field" style={{ width: 90 }} value={dueForm.unit} onChange={e => setDueForm(f => ({ ...f, unit: e.target.value }))}>
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div className="fg"><label>Unit Price *</label><input className="field" type="number" min="0" step="0.01" value={dueForm.unitPrice} onChange={e => setDueForm(f => ({ ...f, unitPrice: e.target.value }))} /></div>
              </div>

              {totalCalc > 0 && (
                <div style={{ background: 'var(--bg4)', borderRadius: 9, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.83rem' }}>
                    <span style={{ color: 'var(--tx2)' }}>Total Amount:</span>
                    <strong style={{ fontFamily: 'monospace', color: 'var(--a4)' }}>{fmt(totalCalc)}</strong>
                  </div>
                </div>
              )}

              <div className="g2">
                <div className="fg"><label>Paid Amount</label><input className="field" type="number" min="0" value={dueForm.paidAmount} onChange={e => setDueForm(f => ({ ...f, paidAmount: e.target.value }))} /></div>
                <div className="fg"><label>Due Date</label><input className="field" type="date" value={dueForm.dueDate} onChange={e => setDueForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
              </div>
              <div className="fg"><label>Notes</label><textarea className="field" rows={2} value={dueForm.notes} onChange={e => setDueForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical' }} /></div>
              <button className="btn btn-p btn-full" onClick={handleAddDue} disabled={saving}>
                {saving ? <><span className="spin" /> Saving...</> : <><i className="fas fa-check" /> Record Due Sale</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Modal ── */}
      {modal === 'payment' && editEntry && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-hd">
              <h3 style={{ fontWeight: 700, fontSize: '.97rem' }}>💸 Record Payment</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'var(--tx2)', cursor: 'pointer', fontSize: '1.1rem' }}><i className="fas fa-times" /></button>
            </div>
            <div className="modal-bd">
              <div style={{ background: 'var(--bg4)', borderRadius: 9, padding: '12px 14px', fontSize: '.82rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--tx2)' }}>Buyer:</span><strong>{editEntry.buyer_name}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--tx2)' }}>Total:</span><strong style={{ fontFamily: 'monospace' }}>{fmt(editEntry.total_amount)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--tx2)' }}>Paid so far:</span><strong style={{ fontFamily: 'monospace', color: 'var(--a2)' }}>{fmt(editEntry.paid_amount)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--bdr)', paddingTop: 6, marginTop: 4 }}><span style={{ fontWeight: 700 }}>Remaining:</span><strong style={{ fontFamily: 'monospace', color: 'var(--a3)' }}>{fmt(editEntry.remaining)}</strong></div>
              </div>
              <div className="fg"><label>Payment Amount *</label><input className="field" type="number" min="0" max={editEntry.remaining} step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder={`Max: ${fmt(editEntry.remaining)}`} autoFocus /></div>
              {parseFloat(payAmount) >= editEntry.remaining && (
                <div className="ibox"><i className="fas fa-check-circle" /> This will fully clear the due amount.</div>
              )}
              <button className="btn btn-s btn-full" onClick={handlePayment} disabled={saving || !payAmount}>
                {saving ? <><span className="spin" /> Recording...</> : <><i className="fas fa-money-bill-wave" /> Confirm Payment</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Buyer Modal ── */}
      {modal === 'buyer' && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-hd">
              <h3 style={{ fontWeight: 700, fontSize: '.97rem' }}>{editBuyer ? '✏️ Edit Buyer' : '👤 Add Buyer'}</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'var(--tx2)', cursor: 'pointer', fontSize: '1.1rem' }}><i className="fas fa-times" /></button>
            </div>
            <div className="modal-bd">
              <div className="fg"><label>Full Name *</label><input className="field" value={buyerForm.name} onChange={e => setBuyerForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="g2">
                <div className="fg"><label>Phone</label><input className="field" type="tel" value={buyerForm.phone} onChange={e => setBuyerForm(f => ({ ...f, phone: e.target.value }))} /></div>
                <div className="fg"><label>Email</label><input className="field" type="email" value={buyerForm.email} onChange={e => setBuyerForm(f => ({ ...f, email: e.target.value }))} /></div>
              </div>
              <div className="fg"><label>Address</label><input className="field" value={buyerForm.address} onChange={e => setBuyerForm(f => ({ ...f, address: e.target.value }))} /></div>
              <div className="fg"><label>Notes</label><textarea className="field" rows={2} value={buyerForm.notes} onChange={e => setBuyerForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical' }} /></div>
              <button className="btn btn-p btn-full" onClick={handleSaveBuyer} disabled={saving}>
                {saving ? <><span className="spin" /> Saving...</> : <><i className="fas fa-check" /> {editBuyer ? 'Save Changes' : 'Add Buyer'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
