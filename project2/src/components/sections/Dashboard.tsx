'use client'
import { useEffect, useMemo } from 'react'
import { useAppStore } from '@/lib/app-store'
import { useApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Package, TrendingUp, TrendingDown, AlertTriangle, DollarSign, ShoppingCart, ArrowRight, Clock } from 'lucide-react'
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#FF5722','#FF9800','#00C853','#2196F3','#9C27B0','#F44336']

export default function DashboardSection() {
  // Fix #8: pull lowStockThreshold from store
  const { inventory, setInventory, transactions, setTransactions, currency, setActiveSection, lowStockThreshold } = useAppStore()
  const api = useApi()
  const fmt = (v: number) => formatCurrency(v, currency)

  useEffect(() => {
    if (inventory.length === 0) api.getInventory().then(setInventory)
    if (transactions.length === 0) api.getTransactions(100).then(r => setTransactions(r.data))
  }, []) // eslint-disable-line

  const s = useMemo(() => {
    const thr = lowStockThreshold || 10
    const act = inventory.filter(i => i.status !== 'Archived')
    const val = act.reduce((s, i) => s + i.quantity * i.buy_price, 0)
    // Fix #8: use dynamic threshold for low/out counts
    const low = act.filter(i => i.quantity > 0 && i.quantity <= thr).length
    const out = act.filter(i => i.quantity <= 0).length
    const today = new Date().toDateString()
    const td = transactions.filter(tx => new Date(tx.date).toDateString() === today)
    const profit = td.filter(tx => tx.profit_loss > 0).reduce((s, tx) => s + tx.profit_loss, 0)
    const loss = td.filter(tx => tx.profit_loss < 0).reduce((s, tx) => s + Math.abs(tx.profit_loss), 0)
    const sales = transactions.filter(tx => tx.txn_type === 'out').reduce((s, tx) => s + tx.sell_price * tx.quantity, 0)
    return { total: act.length, val, low, out, profit, loss, sales, txCount: transactions.length }
  }, [inventory, transactions, lowStockThreshold])

  const catData = useMemo(() => {
    const c: Record<string, number> = {}
    inventory.forEach(i => {
      if (i.status !== 'Archived') c[i.category] = (c[i.category] || 0) + i.quantity
    })
    return Object.entries(c).map(([name, value]) => ({ name, value })).slice(0, 5)
  }, [inventory])

  // Fix #8: filter using dynamic threshold
  const thr = lowStockThreshold || 10
  const lowItems = inventory.filter(i => i.quantity <= 0 || (i.quantity > 0 && i.quantity <= thr)).slice(0, 5)
  const recentTxns = transactions.slice(0, 5)

  const KPIs = [
    { label: 'মোট পণ্য', value: String(s.total), color: '#2196F3', bg: 'var(--info-light)', icon: Package, click: 'inventory' as const },
    { label: 'স্টক মূল্য', value: fmt(s.val), color: '#FF9800', bg: 'rgba(255,152,0,0.1)', icon: DollarSign, click: null },
    { label: 'আজকের লাভ', value: fmt(s.profit), color: '#00C853', bg: 'var(--success-light)', icon: TrendingUp, click: null },
    { label: 'আজকের ক্ষতি', value: fmt(s.loss), color: '#F44336', bg: 'var(--danger-light)', icon: TrendingDown, click: null },
    { label: 'কম স্টক', value: String(s.low), color: '#FF9800', bg: 'rgba(255,152,0,0.1)', icon: AlertTriangle, click: 'inventory' as const },
    { label: 'স্টক শেষ', value: String(s.out), color: '#F44336', bg: 'var(--danger-light)', icon: Package, click: 'inventory' as const },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Hero Card */}
      <div className="card-hero anim-fade-up">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, opacity: 0.8, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            মোট স্টক মূল্য
          </div>
          <div style={{ fontSize: 'clamp(1.6rem,6vw,2.2rem)', fontWeight: 800, fontFamily: 'var(--font-mono)', marginBottom: 12, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {fmt(s.val)}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <div style={{ fontSize: '0.65rem', opacity: 0.75, marginBottom: 2 }}>মোট বিক্রয়</div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>{fmt(s.sales)}</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
            <div>
              <div style={{ fontSize: '0.65rem', opacity: 0.75, marginBottom: 2 }}>লেনদেন</div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>{s.txCount}</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
            <div>
              <div style={{ fontSize: '0.65rem', opacity: 0.75, marginBottom: 2 }}>পণ্য</div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>{s.total}</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid anim-fade-up anim-d1">
        {KPIs.map((k, i) => {
          const Icon = k.icon
          return (
            <div key={i} className="kpi-card" style={{ '--kpi-color': k.color } as React.CSSProperties}
              onClick={() => k.click && setActiveSection(k.click)}>
              <div className="kpi-icon" style={{ background: k.bg, color: k.color }}><Icon size={18} /></div>
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-label">{k.label}</div>
            </div>
          )
        })}
      </div>

      {/* Chart */}
      {catData.length > 0 && (
        <div className="card card-p anim-fade-up anim-d2">
          <div className="section-header">
            <div>
              <div className="section-title">ক্যাটাগরি বিশ্লেষণ</div>
              <div className="section-subtitle">পণ্য বিভাগ অনুযায়ী</div>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catData} barSize={24}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'var(--font-bn)', fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, fontFamily: 'var(--font-bn)', color: 'var(--text)' }} cursor={{ fill: 'var(--primary-bg)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Low Stock Alert — Fix #8: uses dynamic threshold items */}
      {lowItems.length > 0 && (
        <div className="card anim-fade-up anim-d3">
          <div style={{ padding: '14px 14px 0' }}>
            <div className="section-header">
              <div>
                <div className="section-title">⚠️ স্টক সতর্কতা</div>
                <div className="section-subtitle">{lowItems.length} টি পণ্যে সমস্যা</div>
              </div>
              <button className="section-action" onClick={() => setActiveSection('inventory')}>
                সব দেখুন <ArrowRight size={12} style={{ verticalAlign: 'middle' }} />
              </button>
            </div>
          </div>
          {lowItems.map(item => (
            <div key={item.id} className="list-item">
              <div className="list-icon" style={{
                background: item.quantity <= 0 ? 'var(--danger-light)' : 'var(--warning-light)',
                color: item.quantity <= 0 ? 'var(--danger)' : 'var(--warning)'
              }}>
                <Package size={16} />
              </div>
              <div className="list-info">
                <div className="list-title">{item.name}</div>
                <div className="list-sub">{item.category}</div>
              </div>
              <div className="list-right">
                <span className={`badge ${item.quantity <= 0 ? 'badge-danger' : 'badge-warning'}`}>
                  {item.quantity <= 0 ? 'শেষ' : 'কম'}
                </span>
                <span className="text-xs mono" style={{ color: 'var(--text3)' }}>{item.quantity} {item.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Transactions */}
      {recentTxns.length > 0 && (
        <div className="card anim-fade-up anim-d4">
          <div style={{ padding: '14px 14px 0' }}>
            <div className="section-header">
              <div><div className="section-title">সাম্প্রতিক লেনদেন</div></div>
              <button className="section-action" onClick={() => setActiveSection('txhistory')}>
                সব <ArrowRight size={12} style={{ verticalAlign: 'middle' }} />
              </button>
            </div>
          </div>
          {recentTxns.map(tx => (
            <div key={tx.id} className="list-item">
              <div className="list-icon" style={{
                background: tx.txn_type === 'in' ? 'var(--success-light)' : 'var(--danger-light)',
                color: tx.txn_type === 'in' ? 'var(--success)' : 'var(--danger)'
              }}>
                {tx.txn_type === 'in' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              </div>
              <div className="list-info">
                <div className="list-title">{tx.product_name}</div>
                <div className="list-sub">
                  <Clock size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                  {new Date(tx.date).toLocaleDateString('bn-BD')}
                </div>
              </div>
              <div className="list-right">
                <span className="list-amount" style={{ color: tx.txn_type === 'in' ? 'var(--success)' : 'var(--danger)' }}>
                  {tx.txn_type === 'in' ? '+' : '-'}{fmt(Math.abs(tx.profit_loss))}
                </span>
                <span className="text-xs mono text-muted">{tx.quantity} {tx.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {inventory.length === 0 && (
        <div className="card anim-fade-up">
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-title">এখনো কোনো পণ্য নেই</div>
            <div className="empty-sub">ইনভেন্টরি সেকশনে গিয়ে প্রথম পণ্য যোগ করুন</div>
            <button className="btn btn-primary btn-sm" onClick={() => setActiveSection('inventory')}>
              পণ্য যোগ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
