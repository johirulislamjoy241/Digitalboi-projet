'use client'
import { useEffect, useMemo } from 'react'
import { useAppStore } from '@/lib/app-store'
import { useApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Package, TrendingUp, TrendingDown, AlertTriangle, DollarSign, ShoppingCart, ArrowRight, Clock, BarChart2 } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const COLORS = ['#F97316','#FBBF24','#10B981','#3B82F6','#8B5CF6','#EF4444']

export default function DashboardSection() {
  const { inventory, setInventory, transactions, setTransactions, currency, setActiveSection } = useAppStore()
  const api = useApi()
  const fmt = (v: number) => formatCurrency(v, currency)

  useEffect(() => {
    if (inventory.length === 0) api.getInventory().then(setInventory)
    if (transactions.length === 0) api.getTransactions(100).then(r => setTransactions(r.data))
  }, []) // eslint-disable-line

  const s = useMemo(() => {
    const act = inventory.filter(i => i.status !== 'Archived')
    const val = act.reduce((s, i) => s + i.quantity * i.buy_price, 0)
    const low = act.filter(i => i.status === 'Low Stock').length
    const out = act.filter(i => i.status === 'Out of Stock').length
    const today = new Date().toDateString()
    const td = transactions.filter(tx => new Date(tx.date).toDateString() === today)
    const profit = td.filter(tx => tx.profit_loss > 0).reduce((s, tx) => s + tx.profit_loss, 0)
    const loss = td.filter(tx => tx.profit_loss < 0).reduce((s, tx) => s + Math.abs(tx.profit_loss), 0)
    const sales = transactions.filter(tx => tx.txn_type === 'out').reduce((s, tx) => s + tx.sell_price * tx.quantity, 0)
    return { total: act.length, val, low, out, profit, loss, sales, txCount: transactions.length }
  }, [inventory, transactions])

  const catData = useMemo(() => {
    const c: Record<string, number> = {}
    inventory.forEach(i => { if (i.status !== 'Archived') c[i.category] = (c[i.category] || 0) + i.quantity })
    return Object.entries(c).map(([name, value]) => ({ name, value })).slice(0, 6)
  }, [inventory])

  const weekData = useMemo(() => {
    const days = ['রবি','সোম','মঙ্গল','বুধ','বৃহস্পতি','শুক্র','শনি']
    const now = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - (6 - i))
      const ds = d.toDateString()
      const txs = transactions.filter(tx => new Date(tx.date).toDateString() === ds)
      const profit = txs.filter(t => t.profit_loss > 0).reduce((s, t) => s + t.profit_loss, 0)
      const loss = txs.filter(t => t.profit_loss < 0).reduce((s, t) => s + Math.abs(t.profit_loss), 0)
      return { day: days[d.getDay()], profit, loss }
    })
  }, [transactions])

  const lowItems = inventory.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock').slice(0, 5)
  const recentTxns = transactions.slice(0, 6)

  const KPIs = [
    { label: 'মোট পণ্য', value: String(s.total), color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', icon: Package, click: 'inventory' as const },
    { label: 'স্টক মূল্য', value: fmt(s.val), color: '#F97316', bg: 'rgba(249,115,22,0.1)', icon: DollarSign, click: null },
    { label: 'আজকের লাভ', value: fmt(s.profit), color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: TrendingUp, click: null },
    { label: 'আজকের ক্ষতি', value: fmt(s.loss), color: '#EF4444', bg: 'rgba(239,68,68,0.1)', icon: TrendingDown, click: null },
    { label: 'কম স্টক', value: String(s.low), color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: AlertTriangle, click: 'inventory' as const },
    { label: 'স্টক শেষ', value: String(s.out), color: '#EF4444', bg: 'rgba(239,68,68,0.1)', icon: Package, click: 'inventory' as const },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Hero Card */}
      <div className="card-hero anim-fade-up">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.8, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'var(--font)' }}>মোট স্টক মূল্য</div>
              <div style={{ fontSize: 'clamp(1.6rem,6vw,2.2rem)', fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                {fmt(s.val)}
              </div>
            </div>
            <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.15)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
              <BarChart2 size={22} color="white" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { l: 'মোট বিক্রয়', v: fmt(s.sales) },
              { l: 'লেনদেন', v: String(s.txCount) },
              { l: 'পণ্য', v: String(s.total) },
            ].map(item => (
              <div key={item.l}>
                <div style={{ fontSize: '0.62rem', opacity: 0.7, marginBottom: 2, fontFamily: 'var(--font-bn)' }}>{item.l}</div>
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.92rem' }}>{item.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid anim-fade-up anim-d1">
        {KPIs.map((k, i) => {
          const Icon = k.icon
          return (
            <div key={i} className="kpi-card" style={{ '--kpi-color': k.color } as React.CSSProperties} onClick={() => k.click && setActiveSection(k.click)}>
              <div className="kpi-icon" style={{ background: k.bg, color: k.color }}><Icon size={17} /></div>
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-label">{k.label}</div>
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }} className="anim-fade-up anim-d2">

        {/* Weekly Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <div className="section-title-icon"><TrendingUp size={14} /></div>
              সাপ্তাহিক লাভ/ক্ষতি
            </div>
          </div>
          <div className="card-body" style={{ padding: '12px 4px 4px' }}>
            {weekData.some(d => d.profit > 0 || d.loss > 0) ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weekData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: 'var(--font-bn)', fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 10, fontSize: '0.75rem', fontFamily: 'var(--font-bn)', boxShadow: 'var(--shadow-md)' }}
                    formatter={(v: number, n: string) => [fmt(v), n === 'profit' ? 'লাভ' : 'ক্ষতি']}
                  />
                  <Bar dataKey="profit" fill="#10B981" radius={[4,4,0,0]} maxBarSize={28} />
                  <Bar dataKey="loss" fill="#EF4444" radius={[4,4,0,0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: '28px 0' }}>
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-title">ডেটা নেই</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category + Low Stock Row */}
      <div style={{ display: 'grid', gridTemplateColumns: catData.length > 0 ? '1fr 1fr' : '1fr', gap: 14 }} className="anim-fade-up anim-d3">

        {/* Category Pie */}
        {catData.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <div className="section-title-icon"><Package size={14} /></div>
                ক্যাটাগরি
              </div>
            </div>
            <div style={{ padding: '8px 4px 8px' }}>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" innerRadius={30} outerRadius={52} paddingAngle={2} dataKey="value">
                    {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 10, fontSize: '0.73rem', fontFamily: 'var(--font-bn)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {catData.slice(0, 4).map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    <div style={{ fontSize: '0.68rem', color: 'var(--text2)', fontFamily: 'var(--font-bn)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{d.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Low Stock Alerts */}
        {lowItems.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <div className="section-title-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}><AlertTriangle size={14} /></div>
                সতর্কতা
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setActiveSection('inventory')}>
                <ArrowRight size={13} />
              </button>
            </div>
            <div>
              {lowItems.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: item.status === 'Out of Stock' ? 'var(--danger-light)' : 'var(--warning-light)',
                    color: item.status === 'Out of Stock' ? 'var(--danger)' : 'var(--warning)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><Package size={14} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-bn)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>{item.quantity} {item.unit}</div>
                  </div>
                  <span className={`badge ${item.status === 'Out of Stock' ? 'badge-danger' : 'badge-warning'}`}>{item.status === 'Out of Stock' ? 'শেষ' : 'কম'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      {recentTxns.length > 0 && (
        <div className="card anim-fade-up anim-d4">
          <div className="card-header">
            <div className="card-title">
              <div className="section-title-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}><Clock size={14} /></div>
              সাম্প্রতিক লেনদেন
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setActiveSection('transactions')}>
              সব দেখুন <ArrowRight size={13} />
            </button>
          </div>
          <div>
            {recentTxns.map((tx, i) => (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', borderBottom: i < recentTxns.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: tx.profit_loss >= 0 ? 'var(--success-light)' : 'var(--danger-light)',
                  color: tx.profit_loss >= 0 ? 'var(--success)' : 'var(--danger)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {tx.profit_loss >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-bn)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.product_name}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>
                    {tx.quantity} {tx.unit} · {new Date(tx.date).toLocaleDateString('bn-BD')}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: tx.profit_loss >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {tx.profit_loss >= 0 ? '+' : ''}{fmt(tx.profit_loss)}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text4)' }}>{tx.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
