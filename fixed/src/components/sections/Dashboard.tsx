'use client'
import { useEffect, useRef, useMemo } from 'react'
import { useAppStore } from '@/lib/app-store'
import { useApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import {
  Package, TrendingUp, TrendingDown, AlertTriangle,
  DollarSign, ArrowRight, Clock,
} from 'lucide-react'
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#FF5722', '#FF9800', '#00C853', '#2196F3', '#9C27B0', '#F44336']

export default function DashboardSection() {
  const {
    inventory, setInventory,
    transactions, setTransactions,
    currency, setActiveSection,
  } = useAppStore()

  const api = useApi()
  const fmt = (v: number) => formatCurrency(v, currency)

  // Use a ref to prevent duplicate fetches on StrictMode double-invoke
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true

    if (inventory.length === 0) {
      api.getInventory().then(setInventory).catch(console.error)
    }
    // Load up to 1000 transactions so total sales are accurate
    if (transactions.length === 0) {
      api.getTransactions(1000).then(r => setTransactions(r.data)).catch(console.error)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stats = useMemo(() => {
    const active = inventory.filter(i => i.status !== 'Archived')
    const stockValue = active.reduce((sum, i) => sum + i.quantity * i.buy_price, 0)
    const lowStockCount = active.filter(i => i.status === 'Low Stock').length
    const outOfStockCount = active.filter(i => i.status === 'Out of Stock').length

    const todayStr = new Date().toDateString()
    const todayTxns = transactions.filter(tx => new Date(tx.date).toDateString() === todayStr)
    const todayProfit = todayTxns
      .filter(tx => tx.profit_loss > 0)
      .reduce((sum, tx) => sum + tx.profit_loss, 0)
    const todayLoss = todayTxns
      .filter(tx => tx.profit_loss < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.profit_loss), 0)

    // Total sales across ALL loaded transactions
    const totalSales = transactions
      .filter(tx => tx.txn_type === 'out')
      .reduce((sum, tx) => sum + tx.sell_price * tx.quantity, 0)

    return {
      totalProducts: active.length,
      stockValue,
      lowStockCount,
      outOfStockCount,
      todayProfit,
      todayLoss,
      totalSales,
      txCount: transactions.length,
    }
  }, [inventory, transactions])

  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {}
    inventory.forEach(i => {
      if (i.status !== 'Archived') {
        counts[i.category] = (counts[i.category] || 0) + i.quantity
      }
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [inventory])

  const lowStockItems = inventory
    .filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock')
    .slice(0, 5)

  const recentTxns = transactions.slice(0, 5)

  const kpis = [
    {
      label: 'মোট পণ্য', value: String(stats.totalProducts),
      color: '#2196F3', bg: 'var(--info-light)', icon: Package,
      click: 'inventory' as const,
    },
    {
      label: 'স্টক মূল্য', value: fmt(stats.stockValue),
      color: '#FF9800', bg: 'rgba(255,152,0,0.1)', icon: DollarSign,
      click: null,
    },
    {
      label: 'আজকের লাভ', value: fmt(stats.todayProfit),
      color: '#00C853', bg: 'var(--success-light)', icon: TrendingUp,
      click: null,
    },
    {
      label: 'আজকের ক্ষতি', value: fmt(stats.todayLoss),
      color: '#F44336', bg: 'var(--danger-light)', icon: TrendingDown,
      click: null,
    },
    {
      label: 'কম স্টক', value: String(stats.lowStockCount),
      color: '#FF9800', bg: 'rgba(255,152,0,0.1)', icon: AlertTriangle,
      click: 'inventory' as const,
    },
    {
      label: 'স্টক শেষ', value: String(stats.outOfStockCount),
      color: '#F44336', bg: 'var(--danger-light)', icon: Package,
      click: 'inventory' as const,
    },
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
            {fmt(stats.stockValue)}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <div style={{ fontSize: '0.65rem', opacity: 0.75, marginBottom: 2 }}>মোট বিক্রয়</div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>{fmt(stats.totalSales)}</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
            <div>
              <div style={{ fontSize: '0.65rem', opacity: 0.75, marginBottom: 2 }}>লেনদেন</div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>{stats.txCount}</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
            <div>
              <div style={{ fontSize: '0.65rem', opacity: 0.75, marginBottom: 2 }}>পণ্য</div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>{stats.totalProducts}</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid anim-fade-up anim-d1">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <div
              key={i}
              className="kpi-card"
              style={{ '--kpi-color': kpi.color } as React.CSSProperties}
              onClick={() => kpi.click && setActiveSection(kpi.click)}
            >
              <div className="kpi-icon" style={{ background: kpi.bg, color: kpi.color }}>
                <Icon size={18} />
              </div>
              <div className="kpi-value">{kpi.value}</div>
              <div className="kpi-label">{kpi.label}</div>
            </div>
          )
        })}
      </div>

      {/* Category Chart */}
      {categoryChartData.length > 0 && (
        <div className="card card-p anim-fade-up anim-d2">
          <div className="section-header">
            <div>
              <div className="section-title">ক্যাটাগরি বিশ্লেষণ</div>
              <div className="section-subtitle">পণ্য বিভাগ অনুযায়ী</div>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} barSize={24}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fontFamily: 'var(--font-bn)', fill: 'var(--text3)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 10, fontSize: 12, fontFamily: 'var(--font-bn)', color: 'var(--text)',
                  }}
                  cursor={{ fill: 'var(--primary-bg)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {categoryChartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="card anim-fade-up anim-d3">
          <div style={{ padding: '14px 14px 0' }}>
            <div className="section-header">
              <div>
                <div className="section-title">⚠️ স্টক সতর্কতা</div>
                <div className="section-subtitle">{lowStockItems.length} টি পণ্যে সমস্যা</div>
              </div>
              <button className="section-action" onClick={() => setActiveSection('inventory')}>
                সব দেখুন <ArrowRight size={12} style={{ verticalAlign: 'middle' }} />
              </button>
            </div>
          </div>
          {lowStockItems.map(item => (
            <div key={item.id} className="list-item">
              <div
                className="list-icon"
                style={{
                  background: item.status === 'Out of Stock' ? 'var(--danger-light)' : 'var(--warning-light)',
                  color: item.status === 'Out of Stock' ? 'var(--danger)' : 'var(--warning)',
                }}
              >
                <Package size={16} />
              </div>
              <div className="list-info">
                <div className="list-title">{item.name}</div>
                <div className="list-sub">{item.category}</div>
              </div>
              <div className="list-right">
                <span className={`badge ${item.status === 'Out of Stock' ? 'badge-danger' : 'badge-warning'}`}>
                  {item.status === 'Out of Stock' ? 'শেষ' : 'কম'}
                </span>
                <span className="text-xs mono" style={{ color: 'var(--text3)' }}>
                  {item.quantity} {item.unit}
                </span>
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
              <div>
                <div className="section-title">সাম্প্রতিক লেনদেন</div>
              </div>
              <button className="section-action" onClick={() => setActiveSection('txhistory')}>
                সব <ArrowRight size={12} style={{ verticalAlign: 'middle' }} />
              </button>
            </div>
          </div>
          {recentTxns.map(tx => (
            <div key={tx.id} className="list-item">
              <div
                className="list-icon"
                style={{
                  background: tx.txn_type === 'in' ? 'var(--success-light)' : 'var(--danger-light)',
                  color: tx.txn_type === 'in' ? 'var(--success)' : 'var(--danger)',
                }}
              >
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
                <span
                  className="list-amount"
                  style={{ color: tx.txn_type === 'in' ? 'var(--success)' : 'var(--danger)' }}
                >
                  {tx.txn_type === 'in' ? '+' : '-'}{fmt(Math.abs(tx.profit_loss))}
                </span>
                <span className="text-xs mono text-muted">{tx.quantity} {tx.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
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
