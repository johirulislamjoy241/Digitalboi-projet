'use client'
import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '@/lib/app-store'
import { useApi } from '@/lib/api'
import { useToast } from '@/lib/toast-context'
import { formatCurrency, UNITS } from '@/lib/utils'
import type { InventoryItem } from '@/types'

export default function TransactionsSection() {
  const { inventory, setInventory, transactions, setTransactions, currency } = useAppStore()
  const api = useApi()
  const { toast } = useToast()

  const [mode, setMode] = useState<'in' | 'out'>('in')
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null)
  const [searchQ, setSearchQ] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [qty, setQty] = useState('')
  const [unit, setUnit] = useState('pcs')
  const [sellPrice, setSellPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Price update on restock
  const [updatePrice, setUpdatePrice] = useState(false)
  const [newBuyPrice, setNewBuyPrice] = useState('')
  const [newSellPrice, setNewSellPrice] = useState('')

  const fmt = (v: number) => formatCurrency(v, currency)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (inventory.length === 0) api.getInventory().then(setInventory)
  }, []) // run once on mount

  function selectProduct(item: InventoryItem) {
    setSelectedProduct(item)
    setSearchQ(item.name)
    setUnit(item.unit)
    setSellPrice(String(item.sell_price))
    setShowDropdown(false)
  }

  function clearProduct() {
    setSelectedProduct(null)
    setSearchQ('')
    setSellPrice('')
    setQty('')
  }

  const filteredProducts = useMemo(() => {
    if (!searchQ) return inventory.filter(i => i.status !== 'Archived').slice(0, 20)
    return inventory.filter(i => i.status !== 'Archived' && (
      i.name.toLowerCase().includes(searchQ.toLowerCase()) ||
      i.category.toLowerCase().includes(searchQ.toLowerCase())
    ))
  }, [inventory, searchQ])

  // Profit/Loss calculation
  const q = parseFloat(qty) || 0
  const sp = parseFloat(sellPrice) || 0
  const bp = selectedProduct?.buy_price || 0
  const profitPerUnit = sp - bp
  const totalProfit = profitPerUnit * q
  const isLoss = mode === 'out' && totalProfit < 0
  const showProfitPreview = mode === 'out' && selectedProduct && q > 0 && sp > 0

  async function handleSubmit() {
    if (!selectedProduct) return toast('Please select a product', 'er')
    if (!qty || q <= 0) return toast('Please enter a valid quantity', 'er')
    if (mode === 'out' && !notes) return toast('Notes are required for Stock Out', 'er')

    setSubmitting(true)
    try {
      const result = await api.doTransaction({
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        txn_type: mode,
        quantity: q,
        unit,
        buy_price: bp,
        sell_price: mode === 'out' ? sp : undefined,
        notes,
        new_buy_price: updatePrice ? parseFloat(newBuyPrice) : undefined,
        new_sell_price: updatePrice ? parseFloat(newSellPrice) : undefined,
      })

      // Update local inventory
      setInventory(inventory.map(i => i.id === selectedProduct.id
        ? { ...i, quantity: result.new_qty, status: result.new_qty <= 0 ? 'Out of Stock' : result.new_qty <= 10 ? 'Low Stock' : 'In Stock' }
        : i
      ))

      setTransactions([result.data, ...transactions])

      if (mode === 'out') {
        if (result.profit_loss < 0) toast(`⚠️ Loss recorded: ${fmt(Math.abs(result.profit_loss))}`, 'wa')
        else toast(`✅ Sale recorded! Profit: ${fmt(result.profit_loss)}`, 'ok')
      } else {
        toast(`✅ Stock In recorded! New qty: ${result.new_qty}`, 'ok')
      }

      // Reset form
      clearProduct()
      setQty('')
      setNotes('')
      setUpdatePrice(false)
      setNewBuyPrice('')
      setNewSellPrice('')
    } catch (e: unknown) {
      toast((e as Error).message || 'Transaction failed', 'er')
    }
    setSubmitting(false)
  }

  return (
    <div className="section active" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card card-pad">
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>Stock Transaction</div>
          <div style={{ fontSize: '.72rem', color: 'var(--mt)', marginTop: 2 }}>Smart search + profit/loss tracking</div>
        </div>

        {/* Mode toggle */}
        <div className="tog-wrap" style={{ marginBottom: 18 }}>
          <button className={`tog-opt ${mode === 'in' ? 'active' : ''}`} onClick={() => setMode('in')}>
            <i className="fas fa-arrow-circle-down" /> Stock In
          </button>
          <button className={`tog-opt ${mode === 'out' ? 'active' : ''}`} onClick={() => setMode('out')}>
            <i className="fas fa-arrow-circle-up" /> Stock Out (Sale)
          </button>
        </div>

        <div className="g2">
          {/* Product search */}
          <div className="fg">
            <label>Select Product *</label>
            <div className="sd-wrap">
              <div className="sd-iw">
                <i className="fas fa-search sd-ico" />
                <input
                  className="field sd-inp"
                  value={searchQ}
                  onChange={e => { setSearchQ(e.target.value); setShowDropdown(true); if (!e.target.value) setSelectedProduct(null) }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  placeholder="Type to search..."
                  autoComplete="off"
                />
                {selectedProduct && (
                  <button className="sd-clr" style={{ display: 'block' }} onClick={clearProduct}><i className="fas fa-times" /></button>
                )}
              </div>
              {showDropdown && (
                <div className="sd-dd open">
                  {filteredProducts.length === 0
                    ? <div className="sd-empty">No products found</div>
                    : filteredProducts.map(item => (
                      <div key={item.id} className="sd-it" onMouseDown={() => selectProduct(item)}>
                        <span>{item.name} <span style={{ color: 'var(--mt)', fontSize: '.72rem' }}>[{item.category}]</span></span>
                        <span style={{ fontFamily: 'monospace', fontSize: '.72rem', color: item.quantity <= 0 ? 'var(--a3)' : item.quantity <= 10 ? 'var(--a4)' : 'var(--a2)' }}>
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
            {selectedProduct && (
              <div style={{ marginTop: 6, background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 8, padding: '8px 12px', fontSize: '.78rem', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--tx2)' }}>Stock: <strong style={{ color: selectedProduct.quantity <= 0 ? 'var(--a3)' : 'var(--a2)' }}>{selectedProduct.quantity} {selectedProduct.unit}</strong></span>
                <span style={{ color: 'var(--tx2)' }}>Buy: <strong style={{ color: 'var(--a4)', fontFamily: 'monospace' }}>{fmt(selectedProduct.buy_price)}</strong></span>
                <span style={{ color: 'var(--tx2)' }}>Sell: <strong style={{ color: 'var(--a4)', fontFamily: 'monospace' }}>{fmt(selectedProduct.sell_price)}</strong></span>
              </div>
            )}
          </div>

          {/* Qty + Unit */}
          <div className="fg">
            <label>Quantity + Unit *</label>
            <div className="qty-wrap">
              <input className="field" type="number" min="0.01" step="any" placeholder="0" value={qty} onChange={e => setQty(e.target.value)} />
              <select className="field" style={{ width: 90 }} value={unit} onChange={e => setUnit(e.target.value)}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Price update on restock */}
        {mode === 'in' && selectedProduct && (
          <div style={{ background: 'rgba(99,102,241,.05)', border: '1px solid rgba(99,102,241,.15)', borderRadius: 10, padding: '12px 14px', marginTop: 4 }}>
            <div style={{ fontWeight: 700, fontSize: '.8rem', marginBottom: 8 }}><i className="fas fa-tag" style={{ marginRight: 6 }} /> Price Update on Restock</div>
            <div style={{ fontSize: '.77rem', color: 'var(--tx2)', marginBottom: 8 }}>
              Current buy price: <strong style={{ color: 'var(--a4)', fontFamily: 'monospace' }}>{fmt(selectedProduct.buy_price)}</strong>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.8rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={updatePrice} onChange={e => setUpdatePrice(e.target.checked)} style={{ accentColor: 'var(--a4)', width: 16, height: 16 }} />
              Update buy price on this restock?
            </label>
            {updatePrice && (
              <div className="g2" style={{ marginTop: 10 }}>
                <div className="fg"><label>New Buy Price</label><input className="field" type="number" min="0" step="0.01" value={newBuyPrice} onChange={e => setNewBuyPrice(e.target.value)} /></div>
                <div className="fg"><label>New Sell Price (optional)</label><input className="field" type="number" min="0" step="0.01" value={newSellPrice} onChange={e => setNewSellPrice(e.target.value)} /></div>
              </div>
            )}
          </div>
        )}

        {/* Sale fields */}
        {mode === 'out' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
            <div className="g2">
              <div className="fg">
                <label>Selling Price (per unit)</label>
                <input className="field" type="number" min="0" step="0.01" value={sellPrice} onChange={e => setSellPrice(e.target.value)} />
              </div>
              <div className="fg">
                <label>Buying Price (auto-filled)</label>
                <input className="field" type="number" value={bp} readOnly style={{ opacity: .7, cursor: 'not-allowed' }} />
              </div>
            </div>

            {/* Profit/Loss preview */}
            {showProfitPreview && (
              <div className="pcc">
                <div style={{ fontWeight: 700, fontSize: '.82rem', marginBottom: 8 }}><i className="fas fa-calculator" style={{ marginRight: 6 }} /> Profit / Loss Preview</div>
                <div className="pcc-row"><span>Selling Price</span><strong style={{ fontFamily: 'monospace' }}>{fmt(sp)}</strong></div>
                <div className="pcc-row"><span>Buying Price</span><strong style={{ fontFamily: 'monospace' }}>{fmt(bp)}</strong></div>
                <div className="pcc-row"><span>Margin / Unit</span><strong style={{ fontFamily: 'monospace', color: profitPerUnit >= 0 ? 'var(--a2)' : 'var(--a3)' }}>{fmt(profitPerUnit)}</strong></div>
                <div className="pcc-row" style={{ borderTop: '1px solid var(--bdr)', paddingTop: 8, marginTop: 4 }}>
                  <span style={{ fontWeight: 700 }}>Total</span>
                  <strong style={{ fontFamily: 'monospace', fontSize: '1rem', color: totalProfit >= 0 ? 'var(--a4)' : 'var(--a3)' }}>
                    {totalProfit >= 0 ? '+' : ''}{fmt(totalProfit)}
                  </strong>
                </div>
                {isLoss && (
                  <div className="loss-banner" style={{ marginTop: 8 }}>
                    <i className="fas fa-exclamation-triangle" /> Selling below buy price — this will be recorded as a Loss.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="fg" style={{ marginTop: 10 }}>
          <label>Notes {mode === 'out' && <span style={{ color: 'var(--a3)' }}>*</span>}</label>
          <textarea className="field" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes about this transaction..." style={{ resize: 'vertical', minHeight: 52 }} />
        </div>

        <button className="btn btn-s btn-full" onClick={handleSubmit} disabled={submitting} style={{ padding: 13, fontWeight: 700, marginTop: 4 }}>
          {submitting
            ? <><span className="spin" /> Processing...</>
            : <><i className={`fas fa-${mode === 'in' ? 'arrow-circle-down' : 'arrow-circle-up'}`} /> {mode === 'in' ? 'Confirm Stock In' : 'Confirm Stock Out (Sale)'}</>
          }
        </button>
      </div>

      {/* Recent session transactions */}
      {transactions.length > 0 && (
        <div className="card card-pad">
          <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: 12 }}>🔄 Recent Transactions</div>
          {transactions.slice(0, 10).map(txn => {
            const isIn = txn.txn_type === 'in'
            const isLoss = txn.profit_loss < 0
            return (
              <div key={txn.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--bdr)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isIn ? 'rgba(16,185,129,.1)' : isLoss ? 'rgba(244,63,94,.1)' : 'rgba(245,158,11,.1)' }}>
                    <i className={`fas fa-arrow-${isIn ? 'down' : 'up'}`} style={{ fontSize: '.75rem', color: isIn ? 'var(--a2)' : isLoss ? 'var(--a3)' : 'var(--a4)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '.82rem', fontWeight: 600 }}>{txn.product_name}</div>
                    <div style={{ fontSize: '.68rem', color: 'var(--mt)' }}>{isIn ? '+' : '-'}{txn.quantity} {txn.unit} · {txn.old_qty} → {txn.new_qty}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {txn.profit_loss !== 0 && (
                    <div style={{ fontSize: '.78rem', fontWeight: 700, fontFamily: 'monospace', color: isLoss ? 'var(--a3)' : 'var(--a4)' }}>
                      {isLoss ? '' : '+'}{fmt(txn.profit_loss)}
                    </div>
                  )}
                  <div style={{ fontSize: '.68rem', color: 'var(--mt)' }}>{new Date(txn.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
