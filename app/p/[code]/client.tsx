'use client'

const CE: Record<string,string> = { Electronics:'⚡',Clothing:'👕','Food & Beverage':'🍎',Furniture:'🪑',Books:'📚',Stationery:'✏️',Medicine:'💊',Cosmetics:'💄',Hardware:'🔧',Toys:'🎮',Sports:'⚽',Automotive:'🚗',Agriculture:'🌾',General:'📦' }

interface Product {
  id: string; name: string; category: string; sell_price: number;
  unit: string; status: string; image_url?: string; notes?: string; product_link?: string;
}

export default function PublicProductClient({ product, code }: { product: Product | null; code: string }) {
  if (!product) {
    return (
      <div style={{ minHeight: '100dvh', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Hind Siliguri', sans-serif", flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet" />
        <div style={{ width: 72, height: 72, borderRadius: 20, background: '#FFF3F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>❓</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1A1A2E' }}>পণ্য পাওয়া যায়নি</div>
        <div style={{ fontSize: '0.82rem', color: '#8888AA', maxWidth: 280 }}>কোড: <span style={{ fontFamily: 'monospace', background: '#F0F0F0', padding: '2px 6px', borderRadius: 4 }}>{code}</span></div>
        <div style={{ marginTop: 8 }}>
          <img src="/icon.png" alt="Digiboi" style={{ height: 28, opacity: 0.5 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <div style={{ fontSize: '0.7rem', color: '#AAAACC', marginTop: 4 }}>Digiboi — ডিজিটাল ব্যবসা সহকারী</div>
        </div>
      </div>
    )
  }

  const emoji = CE[product.category] || '📦'
  const isAvail = product.status === 'In Stock'
  const isLow = product.status === 'Low Stock'

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F5F5', fontFamily: "'Hind Siliguri', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ width: '100%', background: 'white', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#FF5722,#FF9800)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>📦</div>
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1A1A2E', lineHeight: 1.1 }}>Digiboi</div>
          <div style={{ fontSize: '0.6rem', color: '#FF5722', fontWeight: 600 }}>পণ্যের তথ্য</div>
        </div>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 480, padding: '20px 16px' }}>
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

          {/* Product image / emoji */}
          <div style={{ background: 'linear-gradient(135deg,#FF5722,#FF9800)', padding: '32px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} style={{ width: 80, height: 80, borderRadius: 16, objectFit: 'cover', border: '3px solid rgba(255,255,255,0.3)' }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: 16, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem' }}>{emoji}</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 4, wordBreak: 'break-word' }}>{product.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)' }}>{emoji} {product.category}</div>
            </div>
          </div>

          {/* Details */}
          <div style={{ padding: '20px 20px 4px' }}>
            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#F8F8F8', borderRadius: 12, marginBottom: 12 }}>
              <span style={{ fontSize: '0.78rem', color: '#8888AA' }}>বিক্রয় মূল্য</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FF5722', fontFamily: 'JetBrains Mono, monospace' }}>৳{product.sell_price.toLocaleString()}</span>
            </div>

            {/* Status & unit */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1, padding: '10px 14px', background: '#F8F8F8', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: '#8888AA', marginBottom: 3 }}>একক</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1A1A2E' }}>{product.unit}</div>
              </div>
              <div style={{ flex: 1, padding: '10px 14px', background: isAvail ? '#F0FFF6' : isLow ? '#FFFBF0' : '#FFF0F0', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: '#8888AA', marginBottom: 3 }}>স্টক</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isAvail ? '#00C853' : isLow ? '#FFB300' : '#F44336' }}>
                  {isAvail ? '✓ আছে' : isLow ? '⚠ কম' : '✕ শেষ'}
                </div>
              </div>
            </div>

            {/* Notes */}
            {product.notes && (
              <div style={{ padding: '10px 14px', background: '#F8F8F8', borderRadius: 10, marginBottom: 12 }}>
                <div style={{ fontSize: '0.65rem', color: '#8888AA', marginBottom: 3 }}>নোট</div>
                <div style={{ fontSize: '0.8rem', color: '#4A4A6A', fontFamily: "'Hind Siliguri', sans-serif" }}>{product.notes}</div>
              </div>
            )}

            {/* Product code */}
            <div style={{ padding: '10px 14px', background: '#FFF8F5', border: '1px solid rgba(255,87,34,0.12)', borderRadius: 10, marginBottom: 20 }}>
              <div style={{ fontSize: '0.65rem', color: '#8888AA', marginBottom: 3 }}>পণ্য কোড</div>
              <div style={{ fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace', color: '#FF5722', fontWeight: 600, userSelect: 'all', wordBreak: 'break-all' }}>🔑 {product.product_link}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20, color: '#AAAACC', fontSize: '0.7rem' }}>
          <div style={{ marginBottom: 4 }}>📦 <strong style={{ color: '#FF5722' }}>Digiboi</strong> — ডিজিটাল ব্যবসা সহকারী</div>
          <div>এই পণ্যটি Digiboi ডিজিটাল সিস্টেমে নিবন্ধিত</div>
        </div>
      </div>
    </div>
  )
}
