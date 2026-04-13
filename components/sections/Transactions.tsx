'use client'
import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '@/lib/app-store'
import { useApi } from '@/lib/api'
import { useToast } from '@/lib/toast-context'
import { formatCurrency, UNITS } from '@/lib/utils'
import type { InventoryItem } from '@/types'
import { Search, TrendingUp, TrendingDown, Package, ChevronDown, RefreshCw, Calculator } from 'lucide-react'

export default function TransactionsSection() {
  const { inventory, setInventory, transactions, setTransactions, currency } = useAppStore()
  const api = useApi()
  const { toast } = useToast()
  const [mode, setMode] = useState<'in' | 'out'>('out')
  const [sel, setSel] = useState<InventoryItem | null>(null)
  const [sq, setSq] = useState('')
  const [showDd, setShowDd] = useState(false)
  const [qty, setQty] = useState('')
  const [unit, setUnit] = useState('pcs')
  const [sp, setSp] = useState('')
  const [notes, setNotes] = useState('')
  const [sub, setSub] = useState(false)
  const [updPr, setUpdPr] = useState(false)
  const [nbp, setNbp] = useState('')
  const [nsp, setNsp] = useState('')
  const fmt = (v: number) => formatCurrency(v, currency)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (inventory.length === 0) api.getInventory().then(setInventory) }, [])

  function pick(item: InventoryItem) {
    setSel(item)
    setSq(item.name)
    setUnit(item.unit)
    setSp(String(item.sell_price))
    setShowDd(false)
  }

  function clr() {
    setSel(null); setSq(''); setSp(''); setQty('')
    setUpdPr(false); setNbp(''); setNsp('')
  }

  const filtered = useMemo(() => {
    if (!sq) return inventory.filter(i => i.status !== 'Archived').slice(0, 20)
    return inventory.filter(i =>
      i.status !== 'Archived' && (
        i.name.toLowerCase().includes(sq.toLowerCase()) ||
        i.category.toLowerCase().includes(sq.toLowerCase())
      )
    )
  }, [inventory, sq])

  const q = parseFloat(qty) || 0
  const spN = parseFloat(sp) || 0
  const bp = sel?.buy_price || 0
  const ppu = spN - bp
  const totalProfit = ppu * q
  const totalSale = spN * q
  const showPreview = mode === 'out' && sel && q > 0 && spN > 0
  const stockEnough = sel ? q <= sel.quantity : true
  const isLoss = ppu < 0

  async function submit() {
    if (!sel) return toast('পণ্য নির্বাচন করুন', 'er')
    if (!qty || q <= 0) return toast('সঠিক পরিমাণ দিন', 'er')
    if (mode === 'out') {
      if (spN <= 0) return toast('বিক্রয় মূল্য দিন', 'er')
      if (q > sel.quantity) return toast(`স্টক পর্যাপ্ত নেই (আছে: ${sel.quantity} ${sel.unit})`, 'er')
      if (!notes.trim()) return toast('বিক্রয়ের নোট দিন (ক্রেতার নাম ইত্যাদি)', 'er')
    }

    setSub(true)
    try {
      const res = await api.doTransaction({
        product_id: sel.id,
        product_name: sel.name,
        txn_type: mode,
        quantity: q,
        unit,
        buy_price: bp,
        sell_price: mode === 'out' ? spN : undefined,
        notes: notes.trim(),
        new_buy_price: updPr && nbp ? parseFloat(nbp) : undefined,
        new_sell_price: updPr && nsp ? parseFloat(nsp) : undefined,
      })

      // Update inventory
      setInventory(inventory.map(i =>
        i.id === sel.id
          ? { ...i, quantity: res.new_qty, status: res.new_qty <= 0 ? 'Out of Stock' : res.new_qty <= 10 ? 'Low Stock' : 'In Stock' }
          : i
      ))
      setTransactions([res.data, ...transactions])

      if (mode === 'out') {
        if (res.profit_loss < 0) toast(`⚠️ ক্ষতিতে বিক্রয়! ক্ষতি: ${fmt(Math.abs(res.profit_loss))}`, 'wa')
        else toast(`✅ বিক্রয় সম্পন্ন! লাভ: ${fmt(res.profit_loss)} | নতুন স্টক: ${res.new_qty}`, 'ok')
      } else {
        toast(`✅ স্টক ইন সম্পন্ন! নতুন স্টক: ${res.new_qty} ${unit}`, 'ok')
      }

      clr(); setQty(''); setNotes('')
    } catch (e: unknown) { toast((e as Error).message || 'সমস্যা হয়েছে', 'er') }
    setSub(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Mode toggle */}
      <div className="tabs anim-fade-up">
        <button className={`tab ${mode === 'out' ? 'active' : ''}`} onClick={() => { setMode('out'); clr() }}>
          <TrendingDown size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          স্টক আউট / বিক্রয়
        </button>
        <button className={`tab ${mode === 'in' ? 'active' : ''}`} onClick={() => { setMode('in'); clr() }}>
          <TrendingUp size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          স্টক ইন
        </button>
      </div>

      {/* Form card */}
      <div className="card card-p anim-fade-up anim-d1">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: mode === 'out' ? 'var(--danger-light)' : 'var(--success-light)',
            color: mode === 'out' ? 'var(--danger)' : 'var(--success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {mode === 'out' ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
          </div>
          <div>
            <div className="section-title">{mode === 'out' ? 'বিক্রয় / স্টক আউট' : 'স্টক ইন'}</div>
            <div className="section-subtitle">{mode === 'out' ? 'পণ্য বিক্রয় রেকর্ড করুন' : 'নতুন স্টক যোগ করুন'}</div>
          </div>
        </div>

        {/* Product search */}
        <div className="input-group">
          <label className="input-label">পণ্য নির্বাচন *</label>
          <div style={{ position: 'relative' }}>
            <div className="search-bar" style={{ marginBottom: 0 }} onClick={() => setShowDd(true)}>
              <Search size={15} color="var(--text3)" />
              <input
                value={sq}
                onChange={e => { setSq(e.target.value); setSel(null); setShowDd(true) }}
                onFocus={() => setShowDd(true)}
                placeholder="পণ্যের নাম লিখুন বা খুঁজুন..."
              />
              {sel && <button onClick={clr} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 0, flexShrink: 0 }}>✕</button>}
              <ChevronDown size={14} color="var(--text3)" />
            </div>

            {showDd && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowDd(false)} />
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 12, boxShadow: 'var(--shadow-lg)', zIndex: 20,
                  maxHeight: 240, overflowY: 'auto', marginTop: 4
                }}>
                  {filtered.length === 0 ? (
                    <div style={{ padding: 16, textAlign: 'center', color: 'var(--text3)', fontSize: '0.82rem', fontFamily: 'var(--font-bn)' }}>
                      কোনো পণ্য পাওয়া যায়নি
                    </div>
                  ) : filtered.map(item => (
                    <button
                      key={item.id}
                      onClick={() => pick(item)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', background: 'none', border: 'none',
                        cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background 0.15s'
                      }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>📦</div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-bn)' }}>{item.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>
                          স্টক: {item.quantity} {item.unit} · {item.category}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.82rem' }}>{fmt(item.sell_price)}</div>
                        <span className={`badge ${item.status === 'In Stock' ? 'badge-success' : item.status === 'Low Stock' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.58rem', marginTop: 2, display: 'inline-block' }}>
                          {item.status === 'In Stock' ? 'আছে' : item.status === 'Low Stock' ? 'কম' : 'শেষ'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Selected product info */}
        {sel && (
          <div style={{ background: 'var(--primary-bg)', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-bn)', fontSize: '0.85rem' }}>{sel.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)', marginTop: 2 }}>
                  স্টক: <strong>{sel.quantity} {sel.unit}</strong> · ক্রয়: {fmt(sel.buy_price)} · বিক্রয়: {fmt(sel.sell_price)}
                </div>
              </div>
              <Package size={18} color="var(--primary)" />
            </div>
            {mode === 'out' && sel.quantity <= 5 && (
              <div style={{ fontSize: '0.68rem', color: 'var(--danger)', marginTop: 4, fontFamily: 'var(--font-bn)' }}>
                ⚠ সতর্কতা: স্টক কম ({sel.quantity} {sel.unit})
              </div>
            )}
          </div>
        )}

        {/* Qty + Unit */}
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">পরিমাণ *</label>
            <input className="input" type="number" placeholder="0" value={qty}
              onChange={e => setQty(e.target.value)} min="0.001" step="any" />
            {sel && mode === 'out' && q > sel.quantity && (
              <div style={{ fontSize: '0.68rem', color: 'var(--danger)', marginTop: 3, fontFamily: 'var(--font-bn)' }}>
                ⚠ স্টকের চেয়ে বেশি!
              </div>
            )}
          </div>
          <div className="input-group">
            <label className="input-label">একক</label>
            <select className="input" value={unit} onChange={e => setUnit(e.target.value)}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* Sell price (out only) */}
        {mode === 'out' && (
          <div className="input-group">
            <label className="input-label">বিক্রয় মূল্য (প্রতি {unit}) *</label>
            <input className="input" type="number" placeholder="0.00" value={sp}
              onChange={e => setSp(e.target.value)} step="any" min="0" />
            {sel && sp && parseFloat(sp) < sel.buy_price && (
              <div style={{ fontSize: '0.68rem', color: 'var(--danger)', marginTop: 3, fontFamily: 'var(--font-bn)' }}>
                ⚠ ক্রয় মূল্যের ({fmt(sel.buy_price)}) চেয়ে কম — ক্ষতিতে বিক্রয় হবে!
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="input-group">
          <label className="input-label">নোট {mode === 'out' ? '* (ক্রেতার নাম/তথ্য)' : '(সরবরাহকারী/তথ্য)'}</label>
          <input className="input" placeholder={mode === 'out' ? 'যেমন: রহিম ভাই, ক্যাশ পেমেন্ট' : 'যেমন: ঢাকা ডিপো থেকে'}
            value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        {/* Update price toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--border)', marginTop: 4, marginBottom: updPr ? 12 : 0 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text2)', fontFamily: 'var(--font-bn)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} /> মূল্য আপডেট করুন
          </span>
          <button className={`toggle ${updPr ? 'on' : ''}`} onClick={() => setUpdPr(v => !v)} />
        </div>
        {updPr && (
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">নতুন ক্রয় মূল্য</label>
              <input className="input" type="number" placeholder={sel ? String(sel.buy_price) : '0'} value={nbp}
                onChange={e => setNbp(e.target.value)} step="any" />
            </div>
            <div className="input-group">
              <label className="input-label">নতুন বিক্রয় মূল্য</label>
              <input className="input" type="number" placeholder={sel ? String(sel.sell_price) : '0'} value={nsp}
                onChange={e => setNsp(e.target.value)} step="any" />
            </div>
          </div>
        )}

        {/* Calculation preview */}
        {showPreview && (
          <div style={{
            background: isLoss ? 'var(--danger-light)' : 'var(--success-light)',
            borderRadius: 12, padding: '12px 14px', marginBottom: 14, marginTop: 4
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text3)', fontFamily: 'var(--font-bn)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Calculator size={12} /> হিসাব পূর্বরূপ
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'পরিমাণ', value: `${q} ${unit}` },
                { label: 'মোট বিক্রয়', value: fmt(totalSale) },
                { label: 'মোট ক্রয় মূল্য', value: fmt(bp * q) },
                { label: isLoss ? 'মোট ক্ষতি' : 'মোট লাভ', value: fmt(Math.abs(totalProfit)), highlight: true, loss: isLoss },
              ].map((row, i) => (
                <div key={i} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.4)', borderRadius: 8, padding: '6px 8px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.82rem', color: row.highlight ? (row.loss ? 'var(--danger)' : 'var(--success)') : 'var(--text)' }}>
                    {row.highlight ? (isLoss ? '-' : '+') : ''}{row.value}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>{row.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="btn btn-primary btn-full" onClick={submit} disabled={sub} style={{ padding: 14 }}>
          {sub ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />
              সংরক্ষণ হচ্ছে...
            </span>
          ) : mode === 'out' ? '💸 বিক্রয় নিশ্চিত করুন' : '📥 স্টক ইন নিশ্চিত করুন'}
        </button>
      </div>
    </div>
  )
}
