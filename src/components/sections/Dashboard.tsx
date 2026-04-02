'use client'
import { useEffect, useMemo } from 'react'
import { useAppStore } from '@/lib/app-store'
import { useApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Package, TrendingUp, TrendingDown, AlertTriangle, DollarSign, ShoppingCart, ArrowRight, Clock, Zap, Activity } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

const COLORS = ['#FF4D00','#3B82F6','#00D68F','#FFB800','#8B5CF6','#FF3B5C','#06B6D4']

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
    const loss   = td.filter(tx => tx.profit_loss < 0).reduce((s, tx) => s + Math.abs(tx.profit_loss), 0)
    const sales  = transactions.filter(tx => tx.txn_type === 'out').reduce((s, tx) => s + tx.sell_price * tx.quantity, 0)
    return { total: act.length, val, low, out, profit, loss, sales, txCount: transactions.length }
  }, [inventory, transactions])

  const catData = useMemo(() => {
    const c: Record<string, number> = {}
    inventory.forEach(i => { if (i.status !== 'Archived') c[i.category] = (c[i.category] || 0) + i.quantity })
    return Object.entries(c).map(([name, value]) => ({ name, value })).slice(0, 6)
  }, [inventory])

  const lowItems    = inventory.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock').slice(0, 5)
  const recentTxns  = transactions.slice(0, 5)

  const KPIs = [
    { label:'মোট পণ্য',    value:String(s.total),    color:'#3B82F6',  bg:'var(--info-l)',     icon:Package,     click:'inventory' as const },
    { label:'স্টক মূল্য',  value:fmt(s.val),         color:'#FFB800',  bg:'var(--warning-l)',  icon:DollarSign,  click:null },
    { label:'আজকের লাভ',  value:fmt(s.profit),      color:'#00D68F',  bg:'var(--success-l)',  icon:TrendingUp,  click:null },
    { label:'আজকের ক্ষতি', value:fmt(s.loss),        color:'#FF3B5C',  bg:'var(--danger-l)',   icon:TrendingDown,click:null },
    { label:'কম স্টক',     value:String(s.low),      color:'#FFB800',  bg:'var(--warning-l)',  icon:AlertTriangle,click:'inventory' as const },
    { label:'স্টক শেষ',    value:String(s.out),      color:'#FF3B5C',  bg:'var(--danger-l)',   icon:Package,     click:'inventory' as const },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* ── Hero Card ── */}
      <div className="card-hero anim-fade-up">
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Activity size={14} color="white" />
            </div>
            <span style={{ fontSize:'0.65rem', fontWeight:700, opacity:0.85, letterSpacing:'0.1em', textTransform:'uppercase' }}>মোট স্টক মূল্য</span>
          </div>
          <div style={{ fontSize:'clamp(1.7rem,6vw,2.4rem)', fontWeight:900, fontFamily:'var(--font-mono)', marginBottom:14, letterSpacing:'-0.04em', lineHeight:1.05, textShadow:'0 2px 12px rgba(0,0,0,0.12)' }}>
            {fmt(s.val)}
          </div>
          <div style={{ display:'flex', gap:0, flexWrap:'wrap' }}>
            {[
              { lbl:'মোট বিক্রয়', val:fmt(s.sales) },
              { lbl:'লেনদেন',      val:String(s.txCount) },
              { lbl:'পণ্য',        val:String(s.total) },
            ].map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center' }}>
                {i > 0 && <div style={{ width:1, height:28, background:'rgba(255,255,255,0.22)', margin:'0 16px' }} />}
                <div>
                  <div style={{ fontSize:'0.62rem', opacity:0.75, marginBottom:2, fontWeight:500 }}>{item.lbl}</div>
                  <div style={{ fontWeight:800, fontFamily:'var(--font-mono)', fontSize:'0.95rem' }}>{item.val}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Decorative icon */}
        <div style={{ position:'absolute', right:20, top:'50%', transform:'translateY(-50%)', opacity:0.08, zIndex:0 }}>
          <Zap size={80} color="white" />
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="kpi-grid anim-fade-up anim-d1">
        {KPIs.map((k, i) => {
          const Icon = k.icon
          return (
            <div
              key={i}
              className="kpi-card"
              style={{ '--kpi-color': k.color } as React.CSSProperties}
              onClick={() => k.click && setActiveSection(k.click)}
            >
              <div className="kpi-icon" style={{ background:k.bg, color:k.color }}>
                <Icon size={18} />
              </div>
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-label">{k.label}</div>
            </div>
          )
        })}
      </div>

      {/* ── Chart ── */}
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
              <BarChart data={catData} barSize={22} barGap={4}>
                <XAxis dataKey="name" tick={{ fontSize:10, fontFamily:'var(--font-bn)', fill:'var(--text3)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background:'var(--surface)', border:'1px solid var(--border-md)', borderRadius:12, fontSize:12, fontFamily:'var(--font-bn)', color:'var(--text)', boxShadow:'var(--sh-lg)' }}
                  cursor={{ fill:'var(--bsubtle)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Low Stock Alert ── */}
      {lowItems.length > 0 && (
        <div className="card anim-fade-up anim-d3">
          <div style={{ padding:'16px 16px 0' }}>
            <div className="section-header">
              <div>
                <div className="section-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:24, height:24, borderRadius:7, background:'var(--warning-l)', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
                    <AlertTriangle size={13} color="var(--warning)" />
                  </span>
                  স্টক সতর্কতা
                </div>
                <div className="section-subtitle">{lowItems.length} টি পণ্যে সমস্যা</div>
              </div>
              <button className="section-action" onClick={() => setActiveSection('inventory')}>
                সব দেখুন <ArrowRight size={12} style={{ verticalAlign:'middle' }} />
              </button>
            </div>
          </div>
          {lowItems.map(item => (
            <div key={item.id} className="list-item">
              <div className="list-icon" style={{ background: item.status==='Out of Stock'?'var(--danger-l)':'var(--warning-l)', color: item.status==='Out of Stock'?'var(--danger)':'var(--warning)' }}>
                <Package size={16} />
              </div>
              <div className="list-info">
                <div className="list-title">{item.name}</div>
                <div className="list-sub">{item.category}</div>
              </div>
              <div className="list-right">
                <span className={`badge ${item.status==='Out of Stock'?'badge-danger':'badge-warning'}`}>
                  {item.status==='Out of Stock'?'শেষ':'কম'}
                </span>
                <span className="text-xs mono" style={{ color:'var(--text3)' }}>{item.quantity} {item.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Recent Transactions ── */}
      {recentTxns.length > 0 && (
        <div className="card anim-fade-up anim-d4">
          <div style={{ padding:'16px 16px 0' }}>
            <div className="section-header">
              <div>
                <div className="section-title">সাম্প্রতিক লেনদেন</div>
                <div className="section-subtitle">সর্বশেষ {recentTxns.length} টি</div>
              </div>
              <button className="section-action" onClick={() => setActiveSection('txhistory')}>
                সব <ArrowRight size={12} style={{ verticalAlign:'middle' }} />
              </button>
            </div>
          </div>
          {recentTxns.map(tx => (
            <div key={tx.id} className="list-item">
              <div className="list-icon" style={{ background: tx.txn_type==='in'?'var(--success-l)':'var(--danger-l)', color: tx.txn_type==='in'?'var(--success)':'var(--danger)' }}>
                {tx.txn_type === 'in' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              </div>
              <div className="list-info">
                <div className="list-title">{tx.product_name}</div>
                <div className="list-sub">
                  <Clock size={10} style={{ verticalAlign:'middle', marginRight:3 }} />
                  {new Date(tx.date).toLocaleDateString('bn-BD')}
                </div>
              </div>
              <div className="list-right">
                <span className="list-amount" style={{ color: tx.txn_type==='in'?'var(--success)':'var(--danger)' }}>
                  {tx.txn_type==='in'?'+':'-'}{fmt(Math.abs(tx.profit_loss))}
                </span>
                <span className={`badge ${tx.txn_type==='in'?'badge-success':'badge-danger'}`}>
                  {tx.txn_type==='in'?'ক্রয়':'বিক্রয়'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {inventory.length === 0 && transactions.length === 0 && (
        <div className="empty-state anim-fade-up">
          <div className="empty-icon">🚀</div>
          <div className="empty-title">শুরু করুন!</div>
          <div className="empty-sub">প্রথমে আপনার পণ্য যোগ করুন এবং ব্যবসা পরিচালনা শুরু করুন।</div>
          <button className="btn btn-primary" onClick={() => setActiveSection('inventory')}>
            <Package size={16} /> পণ্য যোগ করুন
          </button>
        </div>
      )}
    </div>
  )
}
