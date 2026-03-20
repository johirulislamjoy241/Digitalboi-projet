'use client'
import { useEffect, useMemo } from 'react'
import { useAppStore } from '@/lib/app-store'
import { useApi } from '@/lib/api'
import { useToast } from '@/lib/toast-context'
import { formatCurrency, formatDate, CHART_COLORS } from '@/lib/utils'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts'

export default function ReportsSection() {
  const { inventory, setInventory, transactions, setTransactions, currency } = useAppStore()
  const api = useApi()
  const { toast } = useToast()
  const fmt = (v: number) => formatCurrency(v, currency)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (inventory.length === 0) api.getInventory().then(setInventory)
    if (transactions.length === 0) api.getTransactions(500).then(r => setTransactions(r.data))
  }, [])

  const report = useMemo(() => {
    const catStock: Record<string, number> = {}
    const catValue: Record<string, number> = {}
    const catProfit: Record<string, number> = {}
    let totalValue = 0, totalItems = 0

    inventory.filter(i => i.status !== 'Archived').forEach(item => {
      catStock[item.category] = (catStock[item.category] || 0) + item.quantity
      const val = item.quantity * item.buy_price
      catValue[item.category] = (catValue[item.category] || 0) + val
      catProfit[item.category] = (catProfit[item.category] || 0) + (item.profit * item.quantity)
      totalValue += val
      totalItems += item.quantity
    })

    // Transactions summary
    let totalProfit = 0, totalLoss = 0, totalSales = 0
    const dayMap: Record<string, { profit: number; sales: number }> = {}
    transactions.forEach(t => {
      if (t.txn_type === 'out') {
        totalSales += t.sell_price * t.quantity
        if (t.profit_loss >= 0) totalProfit += t.profit_loss
        else totalLoss += Math.abs(t.profit_loss)
      }
      const day = new Date(t.date).toLocaleDateString('en-BD', { month: 'short', day: 'numeric' })
      if (!dayMap[day]) dayMap[day] = { profit: 0, sales: 0 }
      if (t.txn_type === 'out') { dayMap[day].profit += t.profit_loss; dayMap[day].sales += t.sell_price * t.quantity }
    })

    const dailyData = Object.entries(dayMap).slice(-14).map(([date, v]) => ({ date, ...v }))
    const stockData = Object.entries(catStock).map(([name, qty]) => ({ name, qty }))
    const valueData = Object.entries(catValue).map(([name, value]) => ({ name, value }))
    const profitData = Object.entries(catProfit).map(([name, profit]) => ({ name, profit }))

    return { totalValue, totalItems, totalProfit, totalLoss, totalSales, dailyData, stockData, valueData, profitData }
  }, [inventory, transactions])

  function exportInventoryCSV() {
    const rows = [
      ['Name', 'Category', 'Qty', 'Unit', 'Buy Price', 'Sell Price', 'Value', 'Profit/Unit', 'Status'],
      ...inventory.map(i => [i.name, i.category, i.quantity, i.unit, i.buy_price, i.sell_price, i.quantity * i.buy_price, i.profit, i.status])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `digiboi_inventory_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    toast('Inventory CSV exported ✅', 'ok')
  }

  function exportTxnCSV() {
    const rows = [
      ['Date', 'Type', 'Product', 'Qty', 'Unit', 'Buy', 'Sell', 'P/L', 'Notes'],
      ...transactions.map(t => [formatDate(t.date), t.type, t.product_name, t.quantity, t.unit, t.buy_price, t.sell_price, t.profit_loss, t.notes || ''])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `digiboi_transactions_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    toast('Transactions CSV exported ✅', 'ok')
  }

  const tooltipStyle = { background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 8, color: 'var(--tx)', fontSize: 12 }

  return (
    <div className="section active" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
        {[
          { label: 'Total Stock Value', value: fmt(report.totalValue), icon: 'fas fa-coins', color: 'var(--a4)' },
          { label: 'Total Items', value: report.totalItems.toString(), icon: 'fas fa-boxes', color: 'var(--a1)' },
          { label: 'Total Sales', value: fmt(report.totalSales), icon: 'fas fa-shopping-cart', color: 'var(--a6)' },
          { label: 'Total Profit', value: fmt(report.totalProfit), icon: 'fas fa-arrow-trend-up', color: 'var(--a2)' },
          { label: 'Total Loss', value: fmt(report.totalLoss), icon: 'fas fa-arrow-trend-down', color: 'var(--a3)' },
          { label: 'Net P/L', value: fmt(report.totalProfit - report.totalLoss), icon: 'fas fa-balance-scale', color: report.totalProfit >= report.totalLoss ? 'var(--a2)' : 'var(--a3)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ width: 34, height: 34, borderRadius: 9, background: `${s.color}26`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <i className={s.icon} style={{ color: s.color, fontSize: '.9rem' }} />
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'monospace', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '.65rem', color: 'var(--mt)', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Export buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btn-g" onClick={exportInventoryCSV}><i className="fas fa-file-csv" /> Export Inventory CSV</button>
        <button className="btn btn-g" onClick={exportTxnCSV}><i className="fas fa-file-csv" /> Export Transactions CSV</button>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card card-pad">
          <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: 12 }}>📦 Stock Qty by Category</div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.stockData}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="qty" name="Stock" radius={[6, 6, 0, 0]}>
                  {report.stockData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card card-pad">
          <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: 12 }}>💰 Stock Value by Category</div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={report.valueData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                  {report.valueData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card card-pad">
          <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: 12 }}>📈 Profit by Category</div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.profitData}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => fmt(v)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Bar dataKey="profit" name="Profit" radius={[6, 6, 0, 0]}>
                  {report.profitData.map((e, i) => <Cell key={i} fill={e.profit >= 0 ? CHART_COLORS[0] : '#f43f5e'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card card-pad">
          <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: 12 }}>📅 Daily Profit (Last 14 days)</div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.dailyData}>
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => fmt(v)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Line type="monotone" dataKey="profit" name="Profit" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
                <Line type="monotone" dataKey="sales" name="Sales" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category detail table */}
      <div className="card card-pad">
        <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: 12 }}>📊 Category Summary</div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>
              <th>Category</th><th style={{ textAlign: 'right' }}>Total Qty</th>
              <th style={{ textAlign: 'right' }}>Stock Value</th>
              <th style={{ textAlign: 'right' }}>Profit Potential</th>
            </tr></thead>
            <tbody>
              {report.stockData.map((row, i) => (
                <tr key={row.name}>
                  <td><span style={{ background: `${CHART_COLORS[i % CHART_COLORS.length]}20`, color: CHART_COLORS[i % CHART_COLORS.length], padding: '3px 10px', borderRadius: 20, fontSize: '.75rem', fontWeight: 600 }}>{row.name}</span></td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{row.qty}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--a4)' }}>{fmt(report.valueData.find(v => v.name === row.name)?.value || 0)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: (report.profitData.find(p => p.name === row.name)?.profit || 0) >= 0 ? 'var(--a2)' : 'var(--a3)' }}>
                    {fmt(report.profitData.find(p => p.name === row.name)?.profit || 0)}
                  </td>
                </tr>
              ))}
              {report.stockData.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--mt)', padding: 24 }}>No data yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
