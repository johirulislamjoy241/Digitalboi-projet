'use client'
import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useAppStore } from '@/lib/app-store'
import { useApi } from '@/lib/api'
import { useToast } from '@/lib/toast-context'
import { formatCurrency } from '@/lib/utils'
import type { InventoryItem } from '@/types'
import { Search, Plus, Minus, Trash2, ShoppingCart, Check, X, User, CreditCard, Banknote, Camera, FlipHorizontal, ScanLine } from 'lucide-react'

interface CartItem {
  product: InventoryItem
  qty: number
  unitPrice: number
}

/* ─── Real Camera Barcode Scanner Component ─── */
function CameraScanner({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animRef = useRef<number>(0)
  const detectorRef = useRef<unknown>(null)
  const scannedRef = useRef(false)
  const [manualCode, setManualCode] = useState('')
  const [camReady, setCamReady] = useState(false)
  const [noNativeSupport, setNoNativeSupport] = useState(false)
  const [facing, setFacing] = useState<'environment' | 'user'>('environment')
  const [scanPos, setScanPos] = useState(0)
  const [scanDir, setScanDir] = useState(1)

  // Animate scanning line
  useEffect(() => {
    const id = setInterval(() => {
      setScanPos(p => {
        setScanDir(d => {
          if (p >= 95) return -1
          if (p <= 5) return 1
          return d
        })
        return p + scanDir * 1.5
      })
    }, 16)
    return () => clearInterval(id)
  }, [scanDir])

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const startDetectionLoop = useCallback(async () => {
    if (!videoRef.current || !detectorRef.current) return
    type Detector = { detect: (v: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> }
    const detector = detectorRef.current as Detector

    const loop = async () => {
      if (scannedRef.current || !videoRef.current) return
      try {
        if (videoRef.current.readyState >= 2) {
          const results = await detector.detect(videoRef.current)
          if (results.length > 0 && results[0].rawValue) {
            scannedRef.current = true
            stopCamera()
            onScan(results[0].rawValue.trim())
            return
          }
        }
      } catch { /* ignore */ }
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
  }, [onScan, stopCamera])

  const startCamera = useCallback(async (facingMode: 'environment' | 'user') => {
    stopCamera()
    scannedRef.current = false
    setCamReady(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = async () => {
          await videoRef.current?.play()
          setCamReady(true)
          // Try native BarcodeDetector (Chrome 83+, Android Chrome, Edge)
          if ('BarcodeDetector' in window) {
            try {
              type BD = new (opts: object) => unknown
              const BD = (window as unknown as { BarcodeDetector: BD }).BarcodeDetector
              detectorRef.current = new BD({
                formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'code_39', 'code_93', 'upc_a', 'upc_e', 'itf', 'codabar', 'data_matrix', 'aztec']
              })
              startDetectionLoop()
            } catch {
              setNoNativeSupport(true)
            }
          } else {
            setNoNativeSupport(true)
          }
        }
      }
    } catch (err) {
      console.error('Camera access error:', err)
      setNoNativeSupport(true)
      setCamReady(true)
    }
  }, [stopCamera, startDetectionLoop])

  useEffect(() => {
    startCamera('environment')
    return () => stopCamera()
  }, []) // eslint-disable-line

  function flipCamera() {
    const nf: 'environment' | 'user' = facing === 'environment' ? 'user' : 'environment'
    setFacing(nf)
    startCamera(nf)
  }

  function handleManual() {
    const code = manualCode.trim()
    if (code.length > 0) {
      onScan(code)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900, background: '#000',
      display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>
      {/* Live camera feed */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#111' }}>
        <video
          ref={videoRef}
          playsInline muted autoPlay
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        {/* Dark vignette overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 22%, transparent 78%, rgba(0,0,0,0.55) 100%)'
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.35), transparent 22%, transparent 78%, rgba(0,0,0,0.35))'
        }} />

        {/* Scan viewfinder frame */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -58%)',
          width: 260, height: 260,
        }}>
          {/* 4 corner brackets */}
          {[
            { top: -2, left: -2, borderTop: '3px solid #FF5722', borderLeft: '3px solid #FF5722', borderRadius: '6px 0 0 0' },
            { top: -2, right: -2, borderTop: '3px solid #FF5722', borderRight: '3px solid #FF5722', borderRadius: '0 6px 0 0' },
            { bottom: -2, left: -2, borderBottom: '3px solid #FF5722', borderLeft: '3px solid #FF5722', borderRadius: '0 0 0 6px' },
            { bottom: -2, right: -2, borderBottom: '3px solid #FF5722', borderRight: '3px solid #FF5722', borderRadius: '0 0 6px 0' },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: 34, height: 34, ...s }} />
          ))}

          {/* Animated scan line */}
          <div style={{
            position: 'absolute', left: 6, right: 6,
            top: `${Math.max(2, Math.min(98, scanPos))}%`,
            height: 2,
            background: 'linear-gradient(90deg, transparent 0%, #FF5722 30%, #FF9800 50%, #FF5722 70%, transparent 100%)',
            boxShadow: '0 0 10px rgba(255,87,34,0.8), 0 0 20px rgba(255,87,34,0.4)',
            borderRadius: 2,
            pointerEvents: 'none',
          }} />
        </div>

        {/* Top toolbar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '12px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 'max(12px, env(safe-area-inset-top))',
        }}>
          <button onClick={onClose} style={{
            width: 42, height: 42, borderRadius: 13, background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.18)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)'
          }}>
            <X size={20} />
          </button>

          <div style={{
            background: 'rgba(0,0,0,0.55)', borderRadius: 20, padding: '8px 16px',
            backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <ScanLine size={16} color="#FF5722" />
            <span style={{ color: 'white', fontFamily: 'var(--font-bn)', fontSize: '0.85rem', fontWeight: 600 }}>
              ক্যামেরা স্ক্যানার
            </span>
          </div>

          <button onClick={flipCamera} style={{
            width: 42, height: 42, borderRadius: 13, background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.18)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)'
          }}>
            <FlipHorizontal size={18} />
          </button>
        </div>

        {/* Status hint */}
        <div style={{
          position: 'absolute', left: 0, right: 0,
          top: 'calc(50% + 148px)',
          textAlign: 'center', padding: '0 20px',
        }}>
          <span style={{
            background: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: '6px 16px',
            color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-bn)', fontSize: '0.78rem',
            backdropFilter: 'blur(8px)', display: 'inline-block',
          }}>
            {!camReady
              ? '📷 ক্যামেরা চালু হচ্ছে...'
              : noNativeSupport
                ? '⌨️ নিচে ম্যানুয়াল কোড লিখুন'
                : 'বারকোড বা QR কোড ফ্রেমে রাখুন'}
          </span>
        </div>
      </div>

      {/* Bottom panel — manual input always available */}
      <div style={{
        background: 'rgba(13,13,22,0.98)',
        padding: '16px 16px',
        paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-bn)', marginBottom: 8, textAlign: 'center' }}>
          {noNativeSupport
            ? '⚠ স্বয়ংক্রিয় স্ক্যান সমর্থিত নয় (iOS/Firefox) — নিচে লিখুন'
            : 'বা ম্যানুয়ালি কোড / পণ্যের নাম লিখুন'}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            style={{
              flex: 1, padding: '12px 14px',
              background: 'rgba(255,255,255,0.09)',
              border: '1.5px solid rgba(255,255,255,0.15)',
              borderRadius: 12, color: 'white',
              fontSize: '0.88rem', fontFamily: 'var(--font-bn)', outline: 'none',
            }}
            placeholder="বারকোড নম্বর বা পণ্যের নাম..."
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManual()}
            autoComplete="off"
          />
          <button
            onClick={handleManual}
            style={{
              padding: '0 18px', background: 'var(--primary)', border: 'none',
              borderRadius: 12, color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(255,87,34,0.4)'
            }}
          >
            <Check size={20} />
          </button>
        </div>
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '12px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12, color: 'rgba(255,255,255,0.65)',
            cursor: 'pointer', fontFamily: 'var(--font-bn)', fontSize: '0.82rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
        >
          <X size={16} /> বাতিল করুন
        </button>
      </div>
    </div>
  )
}

/* ─── Main POS Section ─── */
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
  const [showCamera, setShowCamera] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inventory.length === 0) api.getInventory().then(setInventory)
  }, []) // eslint-disable-line

  function handleBarcodeScan(code: string) {
    const q = code.toLowerCase()
    const found = inventory.find(i =>
      i.status !== 'Archived' && (
        i.name.toLowerCase() === q ||
        (i.product_link && (i.product_link === code || i.product_link.toLowerCase().includes(q))) ||
        i.id === code
      )
    )
    if (found) {
      addToCartDirect(found)
      toast(`✅ ${found.name} কার্টে যোগ হয়েছে`, 'ok')
    } else {
      // Try partial name match
      const partial = inventory.find(i => i.status !== 'Archived' && i.name.toLowerCase().includes(q))
      if (partial) {
        addToCartDirect(partial)
        toast(`✅ ${partial.name} কার্টে যোগ হয়েছে`, 'ok')
      } else {
        toast(`পণ্য পাওয়া যায়নি: "${code}"`, 'er')
      }
    }
    setShowCamera(false)
  }

  const filtered = useMemo(() => {
    const active = inventory.filter(i => i.status !== 'Archived')
    if (!search) return active.slice(0, 30)
    return active.filter(i =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
    )
  }, [inventory, search])

  function addToCartDirect(product: InventoryItem) {
    if (product.quantity <= 0) {
      toast('স্টক শেষ!', 'er')
      return
    }
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id)
      if (existing) {
        if (existing.qty >= product.quantity) {
          toast('স্টক পর্যাপ্ত নেই', 'er')
          return prev
        }
        return prev.map(c => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c)
      }
      return [...prev, { product, qty: 1, unitPrice: product.sell_price }]
    })
  }

  function addToCart(product: InventoryItem) {
    addToCartDirect(product)
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
    Books: '📚', Medicine: '💊', Cosmetics: '💄', Other: '📋',
    'Food & Beverage': '🍎', Furniture: '🪑', Hardware: '🔧', Toys: '🎮',
    Sports: '⚽', Automotive: '🚗', Agriculture: '🌾', Stationery: '✏️',
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100dvh - var(--topbar-h) - var(--nav-h))',
      overflow: 'hidden', margin: '-16px', padding: '12px 12px 0'
    }}>
      {/* Camera Scanner overlay */}
      {showCamera && (
        <CameraScanner onScan={handleBarcodeScan} onClose={() => setShowCamera(false)} />
      )}

      {/* ── Search + Action Bar ── */}
      <div style={{ marginBottom: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Search input */}
          <div className="search-bar" style={{ flex: 1, marginBottom: 0 }}>
            <Search size={15} color="var(--text3)" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="পণ্য খুঁজুন..."
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 0 }}>✕</button>
            )}
          </div>

          {/* Camera scanner button — right side, above nav */}
          <button
            onClick={() => setShowCamera(true)}
            title="ক্যামেরা দিয়ে স্ক্যান করুন"
            style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(255,87,34,0.4)',
              transition: 'all 0.2s'
            }}
          >
            <Camera size={18} />
          </button>

          {/* Cart button */}
          <button
            onClick={() => setShowCart(true)}
            style={{
              position: 'relative', width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: cart.length > 0 ? 'linear-gradient(135deg, #1a73e8, #0d47a1)' : 'var(--surface3)',
              border: cart.length > 0 ? 'none' : '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: cart.length > 0 ? 'white' : 'var(--text3)',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: cart.length > 0 ? '0 4px 14px rgba(26,115,232,0.4)' : 'none',
            }}
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6, width: 20, height: 20,
                background: 'var(--danger)', borderRadius: '50%', color: 'white',
                fontSize: '0.65rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--bg)'
              }}>{cartCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* ── Product Grid (scrollable) ── */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 96 }}>
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div className="empty-icon">🔍</div>
            <div className="empty-title">কোনো পণ্য পাওয়া যায়নি</div>
            <div className="empty-sub">নাম বা ক্যাটাগরি দিয়ে খুঁজুন</div>
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
                    borderRadius: 14, padding: '12px 10px',
                    cursor: isOut ? 'not-allowed' : 'pointer',
                    opacity: isOut ? 0.5 : 1, transition: 'all 0.2s', textAlign: 'left',
                    display: 'flex', flexDirection: 'column', gap: 6, position: 'relative'
                  }}
                >
                  {inCart && (
                    <span style={{
                      position: 'absolute', top: 6, right: 6, width: 20, height: 20,
                      background: 'var(--primary)', borderRadius: '50%', color: 'white',
                      fontSize: '0.6rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>{inCart.qty}</span>
                  )}
                  <div style={{ fontSize: '1.4rem', lineHeight: 1 }}>{CAT_EMOJI[item.category] || '📦'}</div>
                  <div style={{
                    fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)',
                    fontFamily: 'var(--font-bn)', lineHeight: 1.3,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                  }}>
                    {item.name}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem',
                    color: inCart ? 'var(--primary)' : 'var(--text)'
                  }}>
                    {fmt(item.sell_price)}
                  </div>
                  <div style={{
                    fontSize: '0.62rem',
                    color: item.quantity <= 5 ? 'var(--danger)' : 'var(--text3)',
                    fontFamily: 'var(--font-bn)'
                  }}>
                    {item.quantity} {item.unit} {item.quantity <= 5 && '⚠'}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Floating Cart Summary Bar ── */}
      {cart.length > 0 && !showCart && (
        <div
          onClick={() => setShowCart(true)}
          style={{
            position: 'fixed',
            bottom: 'calc(var(--nav-h) + 12px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 80px)',   /* narrower to avoid "more" btn on left */
            maxWidth: 340,
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            borderRadius: 16, padding: '13px 16px',
            boxShadow: '0 8px 24px rgba(255,87,34,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            zIndex: 140, cursor: 'pointer'
          }}
        >
          <div style={{ color: 'white' }}>
            <div style={{ fontSize: '0.68rem', opacity: 0.85, fontFamily: 'var(--font-bn)' }}>কার্টে {cartCount} পণ্য</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem' }}>{fmt(cartTotal)}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, fontFamily: 'var(--font-bn)' }}>চেকআউট</span>
            <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.22)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={16} />
            </div>
          </div>
        </div>
      )}

      {/* ── Cart Bottom Sheet ── */}
      {showCart && (
        <div className="modal-overlay" onClick={() => setShowCart(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '92dvh', overflowY: 'auto' }}>
            <div className="modal-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div className="modal-title" style={{ marginBottom: 2 }}>🛒 কার্ট ({cartCount} পণ্য)</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>পরিমাণ ও মূল্য সম্পাদনা করতে পারেন</div>
              </div>
              <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <div className="empty-icon">🛒</div>
                <div className="empty-title">কার্ট খালি</div>
              </div>
            ) : (
              <>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', borderRadius: 10, padding: '4px 6px', border: '1px solid var(--border)' }}>
                          <button onClick={() => updateQty(item.product.id, -1)} disabled={item.qty <= 1}
                            style={{ width: 24, height: 24, borderRadius: 7, border: 'none', background: 'var(--surface3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', flexShrink: 0 }}>
                            <Minus size={12} />
                          </button>
                          <span style={{ minWidth: 24, textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>{item.qty}</span>
                          <button onClick={() => updateQty(item.product.id, 1)}
                            style={{ width: 24, height: 24, borderRadius: 7, border: 'none', background: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                            <Plus size={12} />
                          </button>
                        </div>
                        <div style={{ flex: 1 }}>
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
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={13} /> ক্রেতার নাম {payMode === 'due' ? '*' : '(ঐচ্ছিক)'}
                  </label>
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

                {payMode === 'cash' && (
                  <div className="input-group">
                    <label className="input-label">প্রদত্ত টাকা</label>
                    <input className="input" type="number" placeholder={String(Math.ceil(cartTotal))} value={cashGiven} onChange={e => setCashGiven(e.target.value)} step="any" />
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
                  ) : payMode === 'cash'
                    ? `✅ বিক্রয় নিশ্চিত — ${fmt(cartTotal)}`
                    : `📋 বকেয়া হিসেবে রেকর্ড করুন`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Success Screen ── */}
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
            <div style={{ fontSize: '0.78rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)', marginBottom: 20 }}>ধন্যবাদ 🙏</div>
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
