'use client'
import { useEffect, useMemo } from 'react'
import { useAppStore } from '@/lib/app-store'
import { useApi } from '@/lib/api'
import { useToast } from '@/lib/toast-context'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { BarChart2, Download, TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react'

const COLORS = ['var(--brand-1)', 'var(--brand-2)', 'var(--success)', 'var(--info)', 'var(--purple)', 'var(--danger)', '#00BCD4', '#8BC34A']
const TT_STYLE = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 11, fontFamily: 'var(--font-bn)', color: 'var(--text)' }

export default function ReportsSection() {
  const { inventory, setInventory, transactions, setTransactions, currency } = useAppStore()
  const api = useApi(); const { toast } = useToast()
  const fmt = (v: number) => formatCurrency(v, currency)

  useEffect(() => {
    if (inventory.length === 0) api.getInventory().then(setInventory)
    if (transactions.length === 0) api.getTransactions(500).then(r => setTransactions(r.data))
  }, []) // eslint-disable-line

  const R = useMemo(() => {
    const cStock: Record<string, number> = {}, cVal: Record<string, number> = {}
    let totalVal = 0, totalItems = 0
    inventory.filter(i => i.status !== 'Archived').forEach(item => {
      cStock[item.category] = (cStock[item.category] || 0) + item.quantity
      const v = item.quantity * item.buy_price
      cVal[item.category] = (cVal[item.category] || 0) + v
      totalVal += v; totalItems += item.quantity
    })
    let totalProfit = 0, totalLoss = 0, totalSales = 0
    const dayMap: Record<string, { profit: number; sales: number }> = {}
    transactions.forEach(t => {
      if (t.txn_type === 'out') {
        totalSales += t.sell_price * t.quantity
        if (t.profit_loss >= 0) totalProfit += t.profit_loss; else totalLoss += Math.abs(t.profit_loss)
      }
      const day = new Date(t.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
      if (!dayMap[day]) dayMap[day] = { profit: 0, sales: 0 }
      if (t.txn_type === 'out') { dayMap[day].profit += t.profit_loss; dayMap[day].sales += t.sell_price * t.quantity }
    })
    return {
      totalVal, totalItems, totalProfit, totalLoss, totalSales,
      daily: Object.entries(dayMap).slice(-10).map(([date, v]) => ({ date, ...v })),
      stockData: Object.entries(cStock).map(([name, qty]) => ({ name, qty })),
      valueData: Object.entries(cVal).map(([name, value]) => ({ name, value })),
    }
  }, [inventory, transactions])

  function exportCSV(type: 'inventory' | 'txns') {
    let rows: unknown[][]
    let fn: string
    if (type === 'inventory') {
      rows = [['Name', 'Category', 'Qty', 'Unit', 'Buy Price', 'Sell Price', 'Value', 'Status'], ...inventory.map(i => [i.name, i.category, i.quantity, i.unit, i.buy_price, i.sell_price, i.quantity * i.buy_price, i.status])]
      fn = `inventory_${new Date().toISOString().slice(0, 10)}.csv`
    } else {
      rows = [['Date', 'Type', 'Product', 'Qty', 'Unit', 'Buy', 'Sell', 'P/L', 'Notes'], ...transactions.map(t => [formatDate(t.date), t.type, t.product_name, t.quantity, t.unit, t.buy_price, t.sell_price, t.profit_loss, t.notes || ''])]
      fn = `transactions_${new Date().toISOString().slice(0, 10)}.csv`
    }
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = fn; a.click()
    toast('CSV এক্সপোর্ট হয়েছে ✅', 'ok')
  }

  const STATS = [
    { label: 'স্টক মূল্য', value: fmt(R.totalVal), color: 'var(--brand-2)', bg: 'rgba(255,152,0,0.1)', icon: DollarSign },
    { label: 'মোট পণ্য', value: String(R.totalItems), color: 'var(--info)', bg: 'var(--info-light)', icon: Package },
    { label: 'মোট বিক্রয়', value: fmt(R.totalSales), color: 'var(--purple)', bg: 'rgba(156,39,176,0.1)', icon: BarChart2 },
    { label: 'মোট লাভ', value: fmt(R.totalProfit), color: 'var(--success)', bg: 'var(--success-light)', icon: TrendingUp },
    { label: 'মোট ক্ষতি', value: fmt(R.totalLoss), color: 'var(--danger)', bg: 'var(--danger-light)', icon: TrendingDown },
    { label: 'নিট লাভ/ক্ষতি', value: fmt(R.totalProfit - R.totalLoss), color: R.totalProfit >= R.totalLoss ? 'var(--success)' : 'var(--danger)', bg: R.totalProfit >= R.totalLoss ? 'var(--success-light)' : 'var(--danger-light)', icon: TrendingUp },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div className="card card-p anim-fade-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="section-title">রিপোর্ট ও বিশ্লেষণ</div>
            <div className="section-subtitle">{transactions.length} লেনদেন · {inventory.length} পণ্য</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => exportCSV('inventory')}>
              <Download size={14} /> পণ্য
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => exportCSV('txns')}>
              <Download size={14} /> লেনদেন
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="kpi-grid anim-fade-up anim-d1">
        {STATS.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="kpi-card" style={{ '--kpi-color': s.color } as React.CSSProperties}>
              <div className="kpi-icon" style={{ background: s.bg, color: s.color }}><Icon size={18} /></div>
              <div className="kpi-value" style={{ fontSize: '0.95rem' }}>{s.value}</div>
              <div className="kpi-label">{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Daily Profit Chart */}
      {R.daily.length > 0 && (
        <div className="card card-p anim-fade-up anim-d2">
          <div className="section-title" style={{ marginBottom: 12 }}>দৈনিক লাভ-ক্ষতি</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={R.daily}>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={TT_STYLE} cursor={{ stroke: 'var(--brand-1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Line type="monotone" dataKey="profit" stroke="#00C853" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--success)' }} name="লাভ" />
                <Line type="monotone" dataKey="sales" stroke="#FF5722" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--brand-1)' }} name="বিক্রয়" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Category Stock Chart */}
      {R.stockData.length > 0 && (
        <div className="card card-p anim-fade-up anim-d3">
          <div className="section-title" style={{ marginBottom: 12 }}>ক্যাটাগরি অনুযায়ী স্টক</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={R.stockData} barSize={22}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: 'var(--font-bn)', fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={TT_STYLE} />
                <Bar dataKey="qty" radius={[6, 6, 0, 0]} name="পরিমাণ">
                  {R.stockData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Value Distribution Pie */}
      {R.valueData.length > 0 && (
        <div className="card card-p anim-fade-up anim-d4">
          <div className="section-title" style={{ marginBottom: 12 }}>মূল্য বিতরণ</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={R.valueData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                  {R.valueData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TT_STYLE} formatter={(v: number) => [fmt(v), 'মূল্য']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
            {R.valueData.map((d, i) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                <span style={{ fontSize: '0.68rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Products */}
      <div className="card anim-fade-up anim-d5">
        <div style={{ padding: '14px 14px 0' }}>
          <div className="section-title" style={{ marginBottom: 12 }}>সেরা পণ্য (মূল্য অনুযায়ী)</div>
        </div>
        {inventory.filter(i => i.status !== 'Archived').sort((a, b) => b.quantity * b.buy_price - a.quantity * a.buy_price).slice(0, 8).map(item => (
          <div key={item.id} className="list-item">
            <div className="list-icon" style={{ background: 'var(--brand-subtle)', color: 'var(--brand-1)', fontSize: '1rem' }}>📦</div>
            <div className="list-info">
              <div className="list-title">{item.name}</div>
              <div className="list-sub">{item.quantity} {item.unit} · {item.category}</div>
            </div>
            <div className="list-right">
              <span className="list-amount">{fmt(item.quantity * item.buy_price)}</span>
              <span className="text-xs text-muted mono">{fmt(item.profit)}/একক</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
