'use client'
import { useEffect, useState, useMemo, useRef } from 'react'
import { useAppStore } from '@/lib/app-store'
import { useApi } from '@/lib/api'
import { useToast } from '@/lib/toast-context'
import { formatCurrency } from '@/lib/utils'
import type { InventoryItem } from '@/types'
import { Search, Plus, Minus, Trash2, ShoppingCart, ScanLine, Check, X, User, CreditCard, Banknote } from 'lucide-react'

interface CartItem {
  product: InventoryItem
  qty: number
  unitPrice: number
}

export default function POSSection() {
  const { inventory, setInventory, transactions, setTransactions, currency } = useAppStore()
  const api = useApi()
  const { toast } = useToast()
  const fmt = (v: number) => formatCurrency(v, currency)

  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [payMode, setPayMode] = useState<'cash' | 'due'>('cash')
  const [cashGiven, setCashGiven] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastSale, setLastSale] = useState<{ total: number; profit: number; change: number } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // QR scan state
  const [scanning, setScanning] = useState(false)
  const [scanBuffer, setScanBuffer] = useState('')
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (inventory.length === 0) api.getInventory().then(setInventory)
  }, []) // eslint-disable-line

  // Handle keyboard-based barcode scanner (HID scanners type fast)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!scanning) return
      if (e.key === 'Enter') {
        if (scanBuffer.length > 2) {
          handleBarcodeScan(scanBuffer.trim())
        }
        setScanBuffer('')
        if (scanTimer.current) clearTimeout(scanTimer.current)
        return
      }
      if (e.key.length === 1) {
        setScanBuffer(prev => prev + e.key)
        if (scanTimer.current) clearTimeout(scanTimer.current)
        scanTimer.current = setTimeout(() => {
          setScanBuffer('')
        }, 300)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown); if (scanTimer.current) clearTimeout(scanTimer.current) }
  }, [scanning, scanBuffer, inventory]) // eslint-disable-line

  function handleBarcodeScan(code: string) {
    // Search by name or product_link containing the barcode
    const found = inventory.find(i =>
      i.status !== 'Archived' && (
        i.name.toLowerCase() === code.toLowerCase() ||
        (i.product_link && i.product_link.includes(code)) ||
        i.id === code
      )
    )
    if (found) {
      addToCart(found)
      toast(`✅ ${found.name} যোগ হয়েছে`, 'ok')
      setScanning(false)
    } else {
      toast(`পণ্য পাওয়া যায়নি: ${code}`, 'er')
    }
  }

  const filtered = useMemo(() => {
    const active = inventory.filter(i => i.status !== 'Archived')
    if (!search) return active.slice(0, 30)
    return active.filter(i =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
    )
  }, [inventory, search])

  function addToCart(product: InventoryItem) {
    if (product.quantity <= 0) return toast('স্টক শেষ!', 'er')
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id)
      if (existing) {
        if (existing.qty >= product.quantity) return toast('স্টক পর্যাপ্ত নেই', 'er'), prev
        return prev.map(c => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c)
      }
      return [...prev, { product, qty: 1, unitPrice: product.sell_price }]
    })
  }

  function updateQty(productId: string, delta: number) {
    setCart(prev => prev.map(c => {
      if (c.product.id !== productId) return c
      const newQty = c.qty + delta
      if (newQty <= 0) return c
      if (newQty > c.product.quantity) { toast('স্টক পর্যাপ্ত নেই', 'wa'); return c }
      return { ...c, qty: newQty }
    }))
  }

  function updatePrice(productId: string, price: string) {
    setCart(prev => prev.map(c => c.product.id === productId ? { ...c, unitPrice: parseFloat(price) || 0 } : c))
  }

  function removeFromCart(productId: string) {
    setCart(prev => prev.filter(c => c.product.id !== productId))
  }

  const cartTotal = cart.reduce((s, c) => s + c.qty * c.unitPrice, 0)
  const cartProfit = cart.reduce((s, c) => s + c.qty * (c.unitPrice - c.product.buy_price), 0)
  const cartCount = cart.reduce((s, c) => s + c.qty, 0)
  const cashGivenNum = parseFloat(cashGiven) || 0
  const change = cashGivenNum - cartTotal

  async function checkout() {
    if (cart.length === 0) return toast('কার্ট খালি', 'er')
    if (payMode === 'due' && !customerName) return toast('বকেয়ার জন্য ক্রেতার নাম দিন', 'er')
    setProcessing(true)
    try {
      const results = []
      for (const item of cart) {
        const res = await api.doTransaction({
          product_id: item.product.id,
          product_name: item.product.name,
          txn_type: 'out',
          quantity: item.qty,
          unit: item.product.unit,
          buy_price: item.product.buy_price,
          sell_price: item.unitPrice,
          notes: customerName ? `POS - ${customerName}` : 'POS বিক্রয়'
        })
        results.push(res)
        // Update inventory in store
        setInventory(prev => prev.map(i => i.id === item.product.id
          ? { ...i, quantity: res.new_qty, status: res.new_qty <= 0 ? 'Out of Stock' : res.new_qty <= 10 ? 'Low Stock' : 'In Stock' }
          : i
        ))
        setTransactions(prev => [res.data, ...prev])
      }

      setLastSale({ total: cartTotal, profit: cartProfit, change: Math.max(0, change) })
      setShowSuccess(true)
      setCart([])
      setCustomerName('')
      setCashGiven('')
      setShowCart(false)
      toast(`✅ বিক্রয় সম্পন্ন! মোট: ${fmt(cartTotal)}`, 'ok')
    } catch (e: unknown) { toast((e as Error).message || 'সমস্যা হয়েছে', 'er') }
    setProcessing(false)
  }

  const CAT_EMOJI: Record<string, string> = {
    General: '📦', Electronics: '⚡', Clothing: '👕', Food: '🍎',
    Books: '📚', Medicine: '💊', Cosmetics: '💄', Other: '📋'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: 'calc(100dvh - var(--topbar-h) - var(--nav-h))', overflow: 'hidden', margin: '-16px', padding: '12px 12px 0' }}>

      {/* Search Header */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 0 }}>
          <div className="search-bar" style={{ flex: 1, marginBottom: 0 }}>
            <Search size={15} color="var(--text3)" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="পণ্য খুঁজুন..."
              autoFocus
            />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 0 }}>✕</button>}
          </div>
          {/* Cart button */}
          <button
            onClick={() => setShowCart(true)}
            style={{
              position: 'relative', width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: cart.length > 0 ? 'linear-gradient(135deg, var(--primary), var(--accent))' : 'var(--surface3)',
              border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: cart.length > 0 ? 'white' : 'var(--text3)', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6, width: 20, height: 20,
                background: 'var(--danger)', borderRadius: '50%', color: 'white',
                fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--bg)'
              }}>{cartCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Product Grid - scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 80 }}>
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div className="empty-icon">🔍</div>
            <div className="empty-title">কোনো পণ্য পাওয়া যায়নি</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {filtered.map(item => {
              const inCart = cart.find(c => c.product.id === item.id)
              const isOut = item.quantity <= 0
              return (
                <button
                  key={item.id}
                  onClick={() => !isOut && addToCart(item)}
                  disabled={isOut}
                  style={{
                    background: inCart ? 'var(--primary-bg)' : 'var(--surface)',
                    border: `1.5px solid ${inCart ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 14, padding: '12px 10px', cursor: isOut ? 'not-allowed' : 'pointer',
                    opacity: isOut ? 0.5 : 1, transition: 'all 0.2s', textAlign: 'left',
                    display: 'flex', flexDirection: 'column', gap: 6, position: 'relative'
                  }}
                >
                  {inCart && (
                    <span style={{
                      position: 'absolute', top: 6, right: 6, width: 20, height: 20,
                      background: 'var(--primary)', borderRadius: '50%', color: 'white',
                      fontSize: '0.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>{inCart.qty}</span>
                  )}
                  <div style={{ fontSize: '1.4rem', lineHeight: 1 }}>{CAT_EMOJI[item.category] || '📦'}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-bn)', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {item.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: inCart ? 'var(--primary)' : 'var(--text)' }}>
                    {fmt(item.sell_price)}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: item.quantity <= 5 ? 'var(--danger)' : 'var(--text3)', fontFamily: 'var(--font-bn)' }}>
                    {item.quantity} {item.unit} {item.quantity <= 5 && '⚠'}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Floating Cart Summary */}
      {cart.length > 0 && !showCart && (
        <div style={{
          position: 'fixed', bottom: 'calc(var(--nav-h) + 12px)', left: '50%',
          transform: 'translateX(-50%)', width: 'calc(100% - 24px)', maxWidth: 406,
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          borderRadius: 16, padding: '14px 16px', boxShadow: '0 8px 24px rgba(255,87,34,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 150,
          cursor: 'pointer'
        }} onClick={() => setShowCart(true)}>
          <div style={{ color: 'white' }}>
            <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>কার্টে {cartCount} পণ্য</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem' }}>{fmt(cartTotal)}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>চেকআউট</span>
            <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.2)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={16} />
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Button */}
      <button
        onClick={() => { setScanning(true); toast('স্ক্যানার চালু! বারকোড স্ক্যান করুন...', 'in') }}
        style={{
          position: 'fixed', bottom: 'calc(var(--nav-h) + 12px)', right: 16,
          width: 48, height: 48, borderRadius: 14,
          background: scanning ? 'var(--success)' : 'var(--surface)',
          border: `2px solid ${scanning ? 'var(--success)' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: scanning ? 'white' : 'var(--text2)',
          boxShadow: 'var(--shadow)', cursor: 'pointer', zIndex: 160, transition: 'all 0.2s'
        }}
      >
        <ScanLine size={20} />
      </button>

      {/* Scanning Overlay */}
      {scanning && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 800,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20
        }}>
          <div style={{ color: 'white', fontSize: '1rem', fontFamily: 'var(--font-bn)', fontWeight: 600 }}>🔍 বারকোড স্ক্যান করুন</div>
          <div style={{
            width: 240, height: 240, border: '3px solid var(--primary)', borderRadius: 20,
            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ position: 'absolute', top: -2, left: -2, width: 30, height: 30, borderTop: '4px solid var(--primary)', borderLeft: '4px solid var(--primary)', borderRadius: '4px 0 0 0' }} />
            <div style={{ position: 'absolute', top: -2, right: -2, width: 30, height: 30, borderTop: '4px solid var(--primary)', borderRight: '4px solid var(--primary)', borderRadius: '0 4px 0 0' }} />
            <div style={{ position: 'absolute', bottom: -2, left: -2, width: 30, height: 30, borderBottom: '4px solid var(--primary)', borderLeft: '4px solid var(--primary)', borderRadius: '0 0 0 4px' }} />
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 30, height: 30, borderBottom: '4px solid var(--primary)', borderRight: '4px solid var(--primary)', borderRadius: '0 0 4px 0' }} />
            <ScanLine size={60} color="rgba(255,87,34,0.4)" />
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', fontFamily: 'var(--font-bn)', textAlign: 'center', maxWidth: 260 }}>
            স্ক্যানার বা কীবোর্ড দিয়ে বারকোড পড়ুন।<br />পণ্যের নামও লিখতে পারেন।
          </div>
          {/* Manual input for mobile */}
          <div style={{ display: 'flex', gap: 8, width: '80%', maxWidth: 280 }}>
            <input
              className="input"
              placeholder="বারকোড / পণ্যের নাম..."
              value={scanBuffer}
              onChange={e => setScanBuffer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleBarcodeScan(scanBuffer)}
              autoFocus
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={() => handleBarcodeScan(scanBuffer)} style={{ padding: '0 14px' }}>
              <Check size={18} />
            </button>
          </div>
          <button className="btn btn-ghost" onClick={() => { setScanning(false); setScanBuffer('') }}>
            <X size={16} /> বাতিল
          </button>
        </div>
      )}

      {/* Cart Sheet */}
      {showCart && (
        <div className="modal-overlay" onClick={() => setShowCart(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '92dvh' }}>
            <div className="modal-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div className="modal-title" style={{ marginBottom: 2 }}>🛒 কার্ট ({cartCount} পণ্য)</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>পরিমাণ ও মূল্য সম্পাদনা করুন</div>
              </div>
              <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {cart.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <div className="empty-icon">🛒</div>
                <div className="empty-title">কার্ট খালি</div>
              </div>
            ) : (
              <div style={{ overflowY: 'auto', maxHeight: '40vh', marginBottom: 16 }}>
                {cart.map(item => (
                  <div key={item.product.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-bn)', marginBottom: 2 }}>{item.product.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>ক্রয়: {fmt(item.product.buy_price)}</div>
                      </div>
                      <button onClick={() => removeFromCart(item.product.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {/* Qty control */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', borderRadius: 10, padding: '4px 6px', border: '1px solid var(--border)' }}>
                        <button onClick={() => updateQty(item.product.id, -1)} disabled={item.qty <= 1} style={{ width: 24, height: 24, borderRadius: 7, border: 'none', background: 'var(--surface3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', flexShrink: 0 }}>
                          <Minus size={12} />
                        </button>
                        <span style={{ minWidth: 24, textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.product.id, 1)} style={{ width: 24, height: 24, borderRadius: 7, border: 'none', background: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                          <Plus size={12} />
                        </button>
                      </div>
                      {/* Price input */}
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input
                          className="input"
                          type="number"
                          value={item.unitPrice}
                          onChange={e => updatePrice(item.product.id, e.target.value)}
                          style={{ padding: '6px 10px', fontSize: '0.82rem', height: 34 }}
                          step="any"
                        />
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', flexShrink: 0, minWidth: 64, textAlign: 'right' }}>
                        {fmt(item.qty * item.unitPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <>
                {/* Totals */}
                <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text2)', fontFamily: 'var(--font-bn)' }}>সর্বমোট</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>{fmt(cartTotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>আনুমানিক লাভ</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600, color: cartProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {cartProfit >= 0 ? '+' : ''}{fmt(cartProfit)}
                    </span>
                  </div>
                </div>

                {/* Customer name */}
                <div className="input-group">
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={13} /> ক্রেতার নাম {payMode === 'due' ? '*' : '(ঐচ্ছিক)'}</label>
                  <input className="input" placeholder="ক্রেতার নাম লিখুন..." value={customerName} onChange={e => setCustomerName(e.target.value)} />
                </div>

                {/* Pay mode */}
                <div className="tabs" style={{ marginBottom: 12 }}>
                  <button className={`tab ${payMode === 'cash' ? 'active' : ''}`} onClick={() => setPayMode('cash')}>
                    <Banknote size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> নগদ
                  </button>
                  <button className={`tab ${payMode === 'due' ? 'active' : ''}`} onClick={() => setPayMode('due')}>
                    <CreditCard size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> বকেয়া
                  </button>
                </div>

                {/* Cash calculation */}
                {payMode === 'cash' && (
                  <div className="input-group">
                    <label className="input-label">প্রদত্ত টাকা</label>
                    <input className="input" type="number" placeholder={String(cartTotal)} value={cashGiven} onChange={e => setCashGiven(e.target.value)} step="any" />
                    {cashGivenNum > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, padding: '8px 12px', background: change >= 0 ? 'var(--success-light)' : 'var(--danger-light)', borderRadius: 8 }}>
                        <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-bn)', color: 'var(--text2)' }}>ফেরত</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: change >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(Math.abs(change))}</span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  className="btn btn-primary btn-full"
                  onClick={checkout}
                  disabled={processing}
                  style={{ padding: 14, fontSize: '0.9rem' }}
                >
                  {processing ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />
                      প্রসেস হচ্ছে...
                    </span>
                  ) : payMode === 'cash' ? `✅ বিক্রয় নিশ্চিত করুন — ${fmt(cartTotal)}` : `📋 বকেয়া হিসেবে রেকর্ড করুন`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Success Screen */}
      {showSuccess && lastSale && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 900,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 24, padding: 28,
            width: '100%', maxWidth: 360, textAlign: 'center',
            animation: 'scale-in 0.35s cubic-bezier(0.34,1.56,0.64,1)'
          }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '2rem' }}>✅</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)', fontFamily: 'var(--font-bn)', marginBottom: 4 }}>বিক্রয় সম্পন্ন!</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)', marginBottom: 20 }}>ধন্যবাদ</div>
            <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '14px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text2)', fontFamily: 'var(--font-bn)' }}>মোট বিক্রয়</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(lastSale.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text2)', fontFamily: 'var(--font-bn)' }}>লাভ</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--success)' }}>+{fmt(lastSale.profit)}</span>
              </div>
              {lastSale.change > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text2)', fontFamily: 'var(--font-bn)' }}>ফেরত</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--info)' }}>{fmt(lastSale.change)}</span>
                </div>
              )}
            </div>
            <button className="btn btn-primary btn-full" onClick={() => { setShowSuccess(false); setLastSale(null) }} style={{ padding: 13 }}>
              নতুন বিক্রয় শুরু করুন
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
