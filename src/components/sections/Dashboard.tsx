'use client'
import { useEffect, useMemo } from 'react'
import { useAppStore } from '@/lib/app-store'
import { useApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { t } from '@/lib/i18n'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const COLORS = ['#6c63ff','#00b4d8','#06d6a0','#ff6b6b','#a78bfa','#ffa62b','#f97316','#00d4aa']
const TT = {
  background:'#fff', border:'1.5px solid rgba(108,99,255,.12)',
  borderRadius:12, color:'#1a1040', fontSize:12,
  boxShadow:'0 8px 24px rgba(108,99,255,.1)'
}

export default function DashboardSection(){
  const { inventory, setInventory, transactions, setTransactions, currency, setActiveSection, lang } = useAppStore()
  const api = useApi()
  const fmt = (v: number) => formatCurrency(v, currency)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (inventory.length === 0) api.getInventory().then(setInventory)
    if (transactions.length === 0) api.getTransactions(100).then(r => setTransactions(r.data))
  }, [])

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
    inventory.forEach(i => {
      if (i.status !== 'Archived') c[i.category] = (c[i.category] || 0) + i.quantity
    })
    return Object.entries(c).map(([name, value]) => ({ name, value }))
  }, [inventory])

  const valData = useMemo(() => {
    const c: Record<string, number> = {}
    inventory.forEach(i => { c[i.category] = (c[i.category] || 0) + i.quantity * i.buy_price })
    return Object.entries(c).map(([name, value]) => ({ name, value }))
  }, [inventory])

  const lowItems = inventory.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock').slice(0, 6)
  const recentTxns = transactions.slice(0, 6)

  const KPI_DATA = [
    { label: t(lang,'totalProducts'), value: String(s.total),    stripe:'#6c63ff', ibg:'#ede9ff', ic:'#5a52e0', ico:'fas fa-boxes',             click:'inventory' },
    { label: t(lang,'stockValue'),    value: fmt(s.val),          stripe:'#ffa62b', ibg:'#fff7e6', ic:'#b45309', ico:'fas fa-coins',              click: null },
    { label: t(lang,'todayProfit'),   value: fmt(s.profit),       stripe:'#06d6a0', ibg:'#e6fbf5', ic:'#047a5e', ico:'fas fa-arrow-trend-up',     click: null },
    { label: t(lang,'todayLoss'),     value: fmt(s.loss),         stripe:'#ff6b6b', ibg:'#fff0f0', ic:'#dc2626', ico:'fas fa-arrow-trend-down',   click: null },
    { label: t(lang,'lowStock'),      value: String(s.low),       stripe:'#ffa62b', ibg:'#fff7e6', ic:'#b45309', ico:'fas fa-exclamation-triangle', click:'inventory' },
    { label: t(lang,'outOfStock'),    value: String(s.out),       stripe:'#ff6b6b', ibg:'#fff0f0', ic:'#dc2626', ico:'fas fa-times-circle',       click:'inventory' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, width:'100%' }}>

      {/* Hero */}
      <div className="card-hero sec-in">
        <div className="card-hero-inner">
          <div style={{ fontSize:'.67rem', fontWeight:700, opacity:.75, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:6 }}>
            {t(lang,'totalStockValue')}
          </div>
          <div style={{ fontSize:'clamp(1.5rem,5vw,2rem)', fontWeight:900, fontFamily:'JetBrains Mono,monospace', marginBottom:12, lineHeight:1.1 }}>
            {fmt(s.val)}
          </div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            {[
              { label:`${s.total} ${t(lang,'activeProducts')}`, icon:'fas fa-box' },
              { label:`${fmt(s.sales)} ${t(lang,'totalSales')}`, icon:'fas fa-shopping-cart' },
              { label:`${s.txCount} ${t(lang,'transactions')}`, icon:'fas fa-exchange-alt' },
            ].map((x,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.72rem', opacity:.88 }}>
                <i className={x.icon} style={{ fontSize:'.63rem' }}/>
                <span style={{ fontWeight:700 }}>{x.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="kpi-grid sec-in sec-in-d1">
        {KPI_DATA.map((k, i) => (
          <div
            key={i}
            className={'kpi' + (k.click ? ' clickable' : '')}
            onClick={k.click ? () => setActiveSection(k.click as any) : undefined}
          >
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:k.stripe, borderRadius:'3px 3px 0 0' }}/>
            <div className="kpi-ico" style={{ background:k.ibg, color:k.ic }}><i className={k.ico}/></div>
            <div className="kpi-val" style={{ color:k.ic }}>{k.value}</div>
            <div className="kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts — responsive grid */}
      <div className="sec-in sec-in-d2" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
        <div className="card cp">
          <div className="chd">
            <div>
              <div className="ct">📦 {t(lang,'stockByCategory')}</div>
              <div className="cs">{t(lang,'quantityDist')}</div>
            </div>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catData} margin={{ top:4, right:4, left:-22, bottom:0 }}>
                <XAxis dataKey="name" tick={{ fill:'#9b95c9', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'#9b95c9', fontSize:10 }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TT} cursor={{ fill:'#f5f3ff' }}/>
                <Bar dataKey="value" name={t(lang,'quantity')} radius={[8,8,0,0]}>
                  {catData.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card cp">
          <div className="chd">
            <div>
              <div className="ct">💰 {t(lang,'valueByCategory')}</div>
              <div className="cs">{t(lang,'investmentDist')}</div>
            </div>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={valData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {valData.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={TT} formatter={(v: number) => fmt(v)}/>
                <Legend iconType="circle" wrapperStyle={{ fontSize:10, color:'#9b95c9' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Stock alerts */}
      {lowItems.length > 0 && (
        <div className="card sec-in sec-in-d3">
          <div className="cp" style={{ paddingBottom:0 }}>
            <div className="chd" style={{ marginBottom:0 }}>
              <div>
                <div className="ct">⚠️ {t(lang,'stockAlerts')}</div>
                <div className="cs">{lowItems.length} {t(lang,'needsAttention')}</div>
              </div>
              <button className="btn btn-gh btn-sm" onClick={() => setActiveSection('inventory')}>
                {t(lang,'viewAll')}
              </button>
            </div>
          </div>
          <div className="tw">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t(lang,'product')}</th>
                  <th>{t(lang,'category')}</th>
                  <th>{t(lang,'quantity')}</th>
                  <th>{t(lang,'status')}</th>
                  <th>{t(lang,'action')}</th>
                </tr>
              </thead>
              <tbody>
                {lowItems.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight:700 }}>{item.name}</td>
                    <td style={{ color:'var(--t3)' }}>{item.category}</td>
                    <td>
                      <span className="mono" style={{ color:item.quantity===0?'var(--rose)':'var(--amber)', fontWeight:800 }}>
                        {item.quantity}
                      </span>
                    </td>
                    <td>
                      <span className={'badge ' + (item.quantity===0?'b-rd':'b-amb')}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-gh btn-xs" onClick={() => setActiveSection('transactions')}>
                        <i className="fas fa-arrow-down"/> {t(lang,'restock')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="card cp sec-in">
        <div className="chd">
          <div><div className="ct">🔄 {t(lang,'recentTransactions')}</div></div>
          <button className="btn btn-gh btn-sm" onClick={() => setActiveSection('txhistory')}>
            {t(lang,'viewAll')}
          </button>
        </div>

        {recentTxns.length === 0 && (
          <div style={{ textAlign:'center', padding:'28px 0', color:'var(--t3)' }}>
            <div style={{ fontSize:'2rem', marginBottom:8, opacity:.3 }}>📭</div>
            <div style={{ fontSize:'.82rem', fontWeight:600 }}>{t(lang,'noTransactions')}</div>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          {recentTxns.map(txn => {
            const isIn = txn.txn_type === 'in'
            const isLoss = txn.profit_loss < 0
            const color = isIn ? 'var(--teal)' : isLoss ? 'var(--rose)' : 'var(--amber)'
            const bg = isIn ? 'var(--teal-l)' : isLoss ? 'var(--acc-l)' : 'var(--amber-l)'
            return (
              <div
                key={txn.id}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:12, transition:'background .12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--p-pale)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                <div style={{ display:'flex', alignItems:'center', gap:11 }}>
                  <div style={{ width:38, height:38, borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', background:bg, flexShrink:0 }}>
                    <i className={'fas fa-arrow-' + (isIn?'down':'up')} style={{ fontSize:'.77rem', color }}/>
                  </div>
                  <div>
                    <div style={{ fontSize:'.83rem', fontWeight:700 }}>{txn.product_name}</div>
                    <div style={{ fontSize:'.68rem', color:'var(--t3)', fontWeight:600 }}>
                      {isIn?'+':'-'}{txn.quantity} {txn.unit} · {new Date(txn.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}
                    </div>
                  </div>
                </div>
                {txn.profit_loss !== 0 && (
                  <span style={{ fontSize:'.79rem', fontWeight:800, fontFamily:'JetBrains Mono,monospace', color:isLoss?'var(--rose)':'var(--teal)' }}>
                    {isLoss ? '' : '+'}{fmt(txn.profit_loss)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
