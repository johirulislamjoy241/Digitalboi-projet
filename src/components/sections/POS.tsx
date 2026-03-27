'use client'
import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useAppStore } from '@/lib/app-store'
import { useApi } from '@/lib/api'
import { useToast } from '@/lib/toast-context'
import { formatCurrency } from '@/lib/utils'
import type { InventoryItem, Transaction } from '@/types'
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Check, X,
  User, CreditCard, Banknote, Camera, FlipHorizontal, ScanLine,
  Package, Tag, Info
} from 'lucide-react'

interface CartItem { product: InventoryItem; qty: number; unitPrice: number }

/* ══════════════════════════════════════════
   CAMERA SCANNER COMPONENT
══════════════════════════════════════════ */
function CameraScanner({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animRef = useRef<number>(0)
  const detectorRef = useRef<unknown>(null)
  const scannedRef = useRef(false)

  const [manualCode, setManualCode] = useState('')
  const [camReady, setCamReady] = useState(false)
  const [noDetector, setNoDetector] = useState(false)
  const [facing, setFacing] = useState<'environment' | 'user'>('environment')
  const [scanY, setScanY] = useState(20)
  const [scanDir, setScanDir] = useState<1 | -1>(1)

  // Animate scan line
  useEffect(() => {
    const id = setInterval(() => {
      setScanY(y => {
        const next = y + scanDir * 1.8
        if (next >= 90) { setScanDir(-1); return 90 }
        if (next <= 10) { setScanDir(1); return 10 }
        return next
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
    if (!videoRef.current || !detectorRef.current || scannedRef.current) return
    type Det = { detect: (v: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> }
    const det = detectorRef.current as Det
    const loop = async () => {
      if (scannedRef.current || !videoRef.current) return
      try {
        if (videoRef.current.readyState >= 2) {
          const r = await det.detect(videoRef.current)
          if (r.length > 0 && r[0].rawValue) {
            scannedRef.current = true
            stopCamera()
            onScan(r[0].rawValue.trim())
            return
          }
        }
      } catch { /* ignore */ }
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
  }, [onScan, stopCamera])

  const startCamera = useCallback(async (fm: 'environment' | 'user') => {
    stopCamera()
    scannedRef.current = false
    setCamReady(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: fm, width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (!videoRef.current) return
      videoRef.current.srcObject = stream
      videoRef.current.onloadedmetadata = async () => {
        try { await videoRef.current?.play() } catch { return }
        setCamReady(true)
        if ('BarcodeDetector' in window) {
          try {
            type BDCtor = new (o: object) => unknown
            const BDClass = (window as unknown as { BarcodeDetector: BDCtor }).BarcodeDetector
            detectorRef.current = new BDClass({
              formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'code_39', 'code_93', 'upc_a', 'upc_e', 'itf', 'codabar', 'data_matrix', 'aztec']
            })
            startDetectionLoop()
          } catch { setNoDetector(true) }
        } else { setNoDetector(true) }
      }
    } catch { setNoDetector(true); setCamReady(true) }
  }, [stopCamera, startDetectionLoop])

  useEffect(() => { startCamera('environment'); return () => stopCamera() }, []) // eslint-disable-line

  function flip() {
    const nf: 'environment' | 'user' = facing === 'environment' ? 'user' : 'environment'
    setFacing(nf); startCamera(nf)
  }

  function submitManual() {
    const c = manualCode.trim()
    if (c) onScan(c)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: '#000', display: 'flex', flexDirection: 'column' }}>
      {/* Camera feed */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <video ref={videoRef} playsInline muted autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {/* Vignette */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.6) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.35), transparent 20%, transparent 80%, rgba(0,0,0,0.35))' }} />

        {/* Viewfinder */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -60%)', width: 260, height: 260 }}>
          {[
            { top: -2, left: -2, borderTop: '3px solid #FF5722', borderLeft: '3px solid #FF5722', borderRadius: '6px 0 0 0' },
            { top: -2, right: -2, borderTop: '3px solid #FF5722', borderRight: '3px solid #FF5722', borderRadius: '0 6px 0 0' },
            { bottom: -2, left: -2, borderBottom: '3px solid #FF5722', borderLeft: '3px solid #FF5722', borderRadius: '0 0 0 6px' },
            { bottom: -2, right: -2, borderBottom: '3px solid #FF5722', borderRight: '3px solid #FF5722', borderRadius: '0 0 6px 0' },
          ].map((s, i) => <div key={i} style={{ position: 'absolute', width: 34, height: 34, ...s }} />)}
          {/* Scan line */}
          <div style={{
            position: 'absolute', left: 6, right: 6, top: `${scanY}%`, height: 2,
            background: 'linear-gradient(90deg, transparent, #FF5722 30%, #FF9800 50%, #FF5722 70%, transparent)',
            boxShadow: '0 0 10px rgba(255,87,34,0.9)', borderRadius: 2, pointerEvents: 'none',
          }} />
        </div>

        {/* Top bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 14px', paddingTop: 'max(14px, env(safe-area-inset-top))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onClose} style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={20} />
          </button>
          <div style={{ background: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ScanLine size={15} color="#FF5722" />
            <span style={{ color: 'white', fontFamily: 'var(--font-bn)', fontSize: '0.85rem', fontWeight: 600 }}>ক্যামেরা স্ক্যানার</span>
          </div>
          <button onClick={flip} style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <FlipHorizontal size={18} />
          </button>
        </div>

        {/* Hint */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(50% + 145px)', textAlign: 'center' }}>
          <span style={{ background: 'rgba(0,0,0,0.65)', borderRadius: 20, padding: '6px 16px', color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-bn)', fontSize: '0.78rem', display: 'inline-block' }}>
            {!camReady ? '📷 ক্যামেরা চালু হচ্ছে...' : noDetector ? '⌨️ নিচে লিখুন' : 'বারকোড ফ্রেমে ধরুন'}
          </span>
        </div>
      </div>

      {/* Bottom panel */}
      <div style={{ background: 'rgba(13,13,22,0.98)', padding: '14px 16px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {noDetector && (
          <div style={{ fontSize: '0.68rem', color: 'rgba(255,165,0,0.85)', fontFamily: 'var(--font-bn)', marginBottom: 8, textAlign: 'center' }}>
            ⚠ এই ব্রাউজারে স্বয়ংক্রিয় স্ক্যান নেই — ম্যানুয়াল লিখুন
          </div>
        )}
        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-bn)', marginBottom: 8, textAlign: 'center' }}>
          বা ম্যানুয়ালি বারকোড / পণ্যের নাম লিখুন
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            style={{ flex: 1, padding: '12px 14px', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 12, color: 'white', fontSize: '0.88rem', fontFamily: 'var(--font-bn)', outline: 'none' }}
            placeholder="বারকোড নম্বর বা পণ্যের নাম..."
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitManual()}
            autoComplete="off"
          />
          <button onClick={submitManual} style={{ padding: '0 18px', background: 'var(--primary)', border: 'none', borderRadius: 12, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={20} />
          </button>
        </div>
        <button onClick={onClose} style={{ width: '100%', padding: '11px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: 'rgba(255,255,255,0.65)', cursor: 'pointer', fontFamily: 'var(--font-bn)', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <X size={15} /> বাতিল
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   SCAN RESULT POPUP — shows product info after scan
══════════════════════════════════════════ */
function ScanResultPopup({ product, onAdd, onClose, fmt }: {
  product: InventoryItem
  onAdd: () => void
  onClose: () => void
  fmt: (v: number) => string
}) {
  const CAT_EMOJI: Record<string, string> = {
    General: '📦', Electronics: '⚡', Clothing: '👕', 'Food & Beverage': '🍎',
    Furniture: '🪑', Books: '📚', Stationery: '✏️', Medicine: '💊', Cosmetics: '💄',
    Hardware: '🔧', Toys: '🎮', Sports: '⚽', Automotive: '🚗', Agriculture: '🌾',
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ScanLine size={18} color="var(--primary)" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-bn)', color: 'var(--text)' }}>স্ক্যান ফলাফল</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Product card */}
        <div style={{ background: 'var(--surface2)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
              {product.image_url
                ? <img src={product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                : CAT_EMOJI[product.category] || '📦'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* 1. Product name */}
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', fontFamily: 'var(--font-bn)', marginBottom: 4 }}>{product.name}</div>
              {/* 3. Category */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Tag size={11} color="var(--text3)" />
                <span style={{ fontSize: '0.72rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>{product.category}</span>
              </div>
            </div>
          </div>

          {/* 2. Description/Notes */}
          {product.notes && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'var(--surface)', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
              <Info size={14} color="var(--info)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text2)', fontFamily: 'var(--font-bn)', lineHeight: 1.5 }}>{product.notes}</span>
            </div>
          )}

          {/* Price row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {/* 4. Sell price */}
            <div style={{ background: 'var(--success-light)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.05rem', color: 'var(--success)' }}>{fmt(product.sell_price)}</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)', marginTop: 2 }}>বিক্রয় মূল্য</div>
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.05rem', color: product.quantity <= 0 ? 'var(--danger)' : product.quantity <= 5 ? 'var(--warning)' : 'var(--text)' }}>{product.quantity} {product.unit}</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)', marginTop: 2 }}>স্টক</div>
            </div>
          </div>

          {/* 5. Digiboi digital listing badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, var(--primary-bg), rgba(255,152,0,0.08))', border: '1px solid var(--primary-glow)', borderRadius: 10, padding: '8px 12px' }}>
            <Package size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-bn)' }}>ডিজিবই তালিকাভুক্ত পণ্য</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>এই পণ্যটি Digiboi-এ নিবন্ধিত · {product.product_link}</div>
            </div>
          </div>
        </div>

        {/* Status warning */}
        {product.quantity <= 0 && (
          <div style={{ background: 'var(--danger-light)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: '0.8rem', color: 'var(--danger)', fontFamily: 'var(--font-bn)', textAlign: 'center', fontWeight: 600 }}>
            ⚠ স্টক শেষ — কার্টে যোগ করা যাবে না
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>বাতিল</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={onAdd} disabled={product.quantity <= 0}>
            <ShoppingCart size={16} /> কার্টে যোগ করুন
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MAIN POS SECTION
══════════════════════════════════════════ */
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
  const [scannedProduct, setScannedProduct] = useState<InventoryItem | null>(null)

  useEffect(() => {
    if (inventory.length === 0) api.getInventory().then(setInventory)
  }, []) // eslint-disable-line

  // ── Barcode scan handler — show product info popup first ──
  function handleBarcodeScan(code: string) {
    setShowCamera(false)
    const q = code.trim().toLowerCase()
    if (!q) return

    // Match by: product_link exact, product_link contains, id, name exact, name contains
    const found = inventory.find(i =>
      i.status !== 'Archived' && (
        (i.product_link && i.product_link.trim() === code.trim()) ||
        (i.product_link && i.product_link.toLowerCase().includes(q)) ||
        i.id === code ||
        i.name.toLowerCase() === q
      )
    ) || inventory.find(i =>
      i.status !== 'Archived' && i.name.toLowerCase().includes(q)
    )

    if (found) {
      // Show product detail popup instead of silently adding
      setScannedProduct(found)
    } else {
      toast(`পণ্য পাওয়া যায়নি: "${code}"`, 'er')
    }
  }

  const filtered = useMemo(() => {
    const active = inventory.filter(i => i.status !== 'Archived')
    if (!search) return active.slice(0, 40)
    return active.filter(i =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
    )
  }, [inventory, search])

  function addToCartDirect(product: InventoryItem) {
    if (product.quantity <= 0) { toast('স্টক শেষ!', 'er'); return }
    setCart(prev => {
      const ex = prev.find(c => c.product.id === product.id)
      if (ex) {
        if (ex.qty >= product.quantity) { toast('স্টক পর্যাপ্ত নেই', 'er'); return prev }
        return prev.map(c => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c)
      }
      return [...prev, { product, qty: 1, unitPrice: product.sell_price }]
    })
  }

  function updateQty(id: string, delta: number) {
    setCart(prev => prev.map(c => {
      if (c.product.id !== id) return c
      const nq = c.qty + delta
      if (nq <= 0) return c
      if (nq > c.product.quantity) { toast('স্টক পর্যাপ্ত নেই', 'wa'); return c }
      return { ...c, qty: nq }
    }))
  }

  function updatePrice(id: string, val: string) {
    setCart(prev => prev.map(c => c.product.id === id ? { ...c, unitPrice: parseFloat(val) || 0 } : c))
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
      let updInv: InventoryItem[] = [...inventory]
      const newTxns: Transaction[] = []
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
        updInv = updInv.map(i => i.id === item.product.id
          ? { ...i, quantity: res.new_qty, status: (res.new_qty <= 0 ? 'Out of Stock' : res.new_qty <= 10 ? 'Low Stock' : 'In Stock') as InventoryItem['status'] }
          : i
        )
        newTxns.push(res.data)
      }
      setInventory(updInv)
      setTransactions([...newTxns, ...transactions])
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
    General: '📦', Electronics: '⚡', Clothing: '👕', 'Food & Beverage': '🍎',
    Furniture: '🪑', Books: '📚', Stationery: '✏️', Medicine: '💊', Cosmetics: '💄',
    Hardware: '🔧', Toys: '🎮', Sports: '⚽', Automotive: '🚗', Agriculture: '🌾',
    Other: '📋',
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100dvh - var(--topbar-h) - var(--nav-h) - env(safe-area-inset-bottom))',
      overflow: 'hidden', margin: '-16px', padding: '10px 10px 0',
    }}>
      {/* Camera overlay */}
      {showCamera && <CameraScanner onScan={handleBarcodeScan} onClose={() => setShowCamera(false)} />}

      {/* Scan result popup */}
      {scannedProduct && (
        <ScanResultPopup
          product={scannedProduct}
          fmt={fmt}
          onAdd={() => { addToCartDirect(scannedProduct); toast(`✅ ${scannedProduct.name} কার্টে যোগ হয়েছে`, 'ok'); setScannedProduct(null) }}
          onClose={() => setScannedProduct(null)}
        />
      )}

      {/* ── Search Row ── */}
      <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 10, flexShrink: 0 }}>
        <div className="search-bar" style={{ flex: 1, marginBottom: 0, minWidth: 0 }}>
          <Search size={15} color="var(--text3)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="পণ্য খুঁজুন..."
            autoFocus
          />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 0, flexShrink: 0 }}>✕</button>}
        </div>

        {/* Camera scan */}
        <button
          onClick={() => setShowCamera(true)}
          style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, var(--primary), var(--accent))', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', boxShadow: '0 4px 14px rgba(255,87,34,0.4)' }}
          title="ক্যামেরা স্ক্যান"
        >
          <Camera size={18} />
        </button>

        {/* Cart */}
        <button
          onClick={() => setShowCart(true)}
          style={{ position: 'relative', width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: cartCount > 0 ? 'linear-gradient(135deg, #1a73e8, #0d47a1)' : 'var(--surface3)', border: cartCount > 0 ? 'none' : '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: cartCount > 0 ? 'white' : 'var(--text3)', cursor: 'pointer', boxShadow: cartCount > 0 ? '0 4px 14px rgba(26,115,232,0.4)' : 'none' }}
        >
          <ShoppingCart size={18} />
          {cartCount > 0 && (
            <span style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, background: 'var(--danger)', borderRadius: '50%', color: 'white', fontSize: '0.62rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg)' }}>{cartCount}</span>
          )}
        </button>
      </div>

      {/* ── Product Grid ── */}
      <div style={{ flex: 1, overflowY: 'scroll', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y', paddingBottom: 100 }}>
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🔍</div><div className="empty-title">পণ্য পাওয়া যায়নি</div></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {filtered.map(item => {
              const inCart = cart.find(c => c.product.id === item.id)
              const isOut = item.quantity <= 0
              return (
                <button
                  key={item.id}
                  onClick={() => !isOut && addToCartDirect(item)}
                  disabled={isOut}
                  style={{ background: inCart ? 'var(--primary-bg)' : 'var(--surface)', border: `1.5px solid ${inCart ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 14, padding: '12px 10px', cursor: isOut ? 'not-allowed' : 'pointer', opacity: isOut ? 0.5 : 1, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 5, position: 'relative', WebkitTapHighlightColor: 'transparent' }}
                >
                  {inCart && <span style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, background: 'var(--primary)', borderRadius: '50%', color: 'white', fontSize: '0.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{inCart.qty}</span>}
                  <div style={{ fontSize: '1.4rem', lineHeight: 1 }}>{CAT_EMOJI[item.category] || '📦'}</div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-bn)', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: inCart ? 'var(--primary)' : 'var(--text)' }}>{fmt(item.sell_price)}</div>
                  <div style={{ fontSize: '0.6rem', color: item.quantity <= 5 ? 'var(--danger)' : 'var(--text3)', fontFamily: 'var(--font-bn)' }}>{item.quantity} {item.unit} {item.quantity <= 5 && '⚠'}</div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Floating cart bar ── */}
      {cartCount > 0 && !showCart && (
        <div
          onClick={() => setShowCart(true)}
          style={{ position: 'fixed', bottom: 'calc(var(--nav-h) + env(safe-area-inset-bottom) + 12px)', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)', maxWidth: 380, background: 'linear-gradient(135deg, var(--primary), var(--accent))', borderRadius: 16, padding: '13px 16px', boxShadow: '0 8px 24px rgba(255,87,34,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 140, cursor: 'pointer' }}
        >
          <div style={{ color: 'white' }}>
            <div style={{ fontSize: '0.68rem', opacity: 0.85, fontFamily: 'var(--font-bn)' }}>কার্টে {cartCount} পণ্য</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem' }}>{fmt(cartTotal)}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, fontFamily: 'var(--font-bn)' }}>চেকআউট →</span>
          </div>
        </div>
      )}

      {/* ── Cart Sheet ── */}
      {showCart && (
        <div className="modal-overlay" onClick={() => setShowCart(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div className="modal-title" style={{ marginBottom: 2 }}>🛒 কার্ট ({cartCount} পণ্য)</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>পরিমাণ ও মূল্য পরিবর্তন করতে পারেন</div>
              </div>
              <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {cart.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}><div className="empty-icon">🛒</div><div className="empty-title">কার্ট খালি</div></div>
            ) : (
              <>
                {/* Cart items */}
                {cart.map(item => (
                  <div key={item.product.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-bn)', marginBottom: 1 }}>{item.product.name}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>ক্রয়: {fmt(item.product.buy_price)}</div>
                      </div>
                      <button onClick={() => setCart(p => p.filter(c => c.product.id !== item.product.id))} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', flexShrink: 0 }}><Trash2 size={14} /></button>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--surface2)', borderRadius: 10, padding: '4px 6px', border: '1px solid var(--border)', flexShrink: 0 }}>
                        <button onClick={() => updateQty(item.product.id, -1)} disabled={item.qty <= 1} style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'var(--surface3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}><Minus size={12} /></button>
                        <span style={{ minWidth: 24, textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.88rem' }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.product.id, 1)} style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Plus size={12} /></button>
                      </div>
                      <input className="input" type="number" value={item.unitPrice} onChange={e => updatePrice(item.product.id, e.target.value)} style={{ flex: 1, padding: '6px 10px', fontSize: '0.82rem', height: 36, minWidth: 0 }} step="any" />
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0, minWidth: 60, textAlign: 'right' }}>{fmt(item.qty * item.unitPrice)}</span>
                    </div>
                  </div>
                ))}

                {/* Totals */}
                <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '12px 14px', marginTop: 14, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text2)', fontFamily: 'var(--font-bn)' }}>সর্বমোট</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem' }}>{fmt(cartTotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>আনুমানিক লাভ</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600, color: cartProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{cartProfit >= 0 ? '+' : ''}{fmt(cartProfit)}</span>
                  </div>
                </div>

                {/* Customer */}
                <div className="input-group">
                  <label className="input-label"><User size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />ক্রেতার নাম {payMode === 'due' ? '*' : '(ঐচ্ছিক)'}</label>
                  <input className="input" placeholder="ক্রেতার নাম..." value={customerName} onChange={e => setCustomerName(e.target.value)} />
                </div>

                {/* Pay mode */}
                <div className="tabs" style={{ marginBottom: 12 }}>
                  <button className={`tab ${payMode === 'cash' ? 'active' : ''}`} onClick={() => setPayMode('cash')}><Banknote size={13} style={{ verticalAlign: 'middle', marginRight: 3 }} />নগদ</button>
                  <button className={`tab ${payMode === 'due' ? 'active' : ''}`} onClick={() => setPayMode('due')}><CreditCard size={13} style={{ verticalAlign: 'middle', marginRight: 3 }} />বকেয়া</button>
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

                <button className="btn btn-primary btn-full" onClick={checkout} disabled={processing} style={{ padding: 14, fontSize: '0.9rem' }}>
                  {processing
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />প্রসেস...</span>
                    : payMode === 'cash' ? `✅ বিক্রয় নিশ্চিত — ${fmt(cartTotal)}` : `📋 বকেয়া রেকর্ড করুন`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Success ── */}
      {showSuccess && lastSale && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 24, padding: 28, width: '100%', maxWidth: 360, textAlign: 'center', animation: 'scale-in 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '2rem' }}>✅</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)', fontFamily: 'var(--font-bn)', marginBottom: 4 }}>বিক্রয় সম্পন্ন!</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)', marginBottom: 20 }}>ধন্যবাদ 🙏</div>
            <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: 14, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ fontSize: '0.8rem', color: 'var(--text2)', fontFamily: 'var(--font-bn)' }}>মোট বিক্রয়</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(lastSale.total)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ fontSize: '0.8rem', color: 'var(--text2)', fontFamily: 'var(--font-bn)' }}>লাভ</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--success)' }}>+{fmt(lastSale.profit)}</span></div>
              {lastSale.change > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '0.8rem', color: 'var(--text2)', fontFamily: 'var(--font-bn)' }}>ফেরত</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--info)' }}>{fmt(lastSale.change)}</span></div>}
            </div>
            <button className="btn btn-primary btn-full" onClick={() => { setShowSuccess(false); setLastSale(null) }} style={{ padding: 13 }}>নতুন বিক্রয় শুরু করুন</button>
          </div>
        </div>
      )}
    </div>
  )
}
