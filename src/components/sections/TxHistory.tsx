'use client'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/app-store'
import { useApi } from '@/lib/api'
import { useToast } from '@/lib/toast-context'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Transaction } from '@/types'

const TYPE_BADGE: Record<string, string> = {
  'Stock In':   'badge-in',
  'Stock Out':  'badge-out',
  'Loss':       'badge-loss',
  'Price Update': 'badge-price',
  'Due Payment':  'badge-pay',
}

export default function TxHistorySection() {
  const { currency } = useAppStore()
  const api = useApi()
  const { toast } = useToast()

  const [allTxns, setAllTxns] = useState<Transaction[]>([])
  const [filtered, setFiltered] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 20

  const fmt = (v: number) => formatCurrency(v, currency)

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.getTransactions(500)
      setAllTxns(data)
      setFiltered(data)
      toast(`Loaded ${data.length} transactions`, 'ok')
    } catch {
      toast('Failed to load transactions', 'er')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function applyFilter(type: string) {
    setTypeFilter(type)
    setPage(1)
    if (!type) { setFiltered(allTxns); return }
    setFiltered(allTxns.filter(t => t.type === type))
  }

  function exportCSV() {
    const headers = ['Date','Type','Product','Qty','Unit','Buy Price','Sell Price','P/L','Notes']
    const rows = filtered.map(t => [
      formatDate(t.date), t.type, t.product_name, t.quantity, t.unit,
      t.buy_price, t.sell_price, t.profit_loss, t.notes || ''
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `digiboi_txn_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    toast('CSV exported ✅', 'ok')
  }

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  return (
    <div className="section active" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card card-pad">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Transaction History</div>
            <div style={{ fontSize: '.72rem', color: 'var(--mt)', marginTop: 2 }}>{filtered.length} records</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="field" style={{ width: 150, fontSize: '.82rem', padding: '8px 10px' }} value={typeFilter} onChange={e => applyFilter(e.target.value)}>
              <option value="">All Types</option>
              <option>Stock In</option><option>Stock Out</option><option>Loss</option>
              <option>Price Update</option><option>Due Payment</option>
            </select>
            <button className="btn btn-g btn-sm" onClick={load} disabled={loading}><i className="fas fa-sync-alt" /> Refresh</button>
            <button className="btn btn-g btn-sm" onClick={exportCSV}><i className="fas fa-download" /> CSV</button>
          </div>
        </div>

        <div className="tbl-wrap">
          <table className="tbl" style={{ minWidth: 700 }}>
            <thead><tr>
              <th>Date & Time</th><th>Type</th><th>Product</th><th>Qty</th>
              <th>Buy</th><th>Sell</th><th>P/L</th><th>Notes</th>
            </tr></thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 28 }}><span className="spin" /> Loading all records...</td></tr>}
              {!loading && paginated.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 28, color: 'var(--mt)' }}>No transactions found</td></tr>}
              {paginated.map(txn => {
                const isLoss = txn.profit_loss < 0
                return (
                  <tr key={txn.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '.78rem' }}>{formatDate(txn.date)}</td>
                    <td><span className={`badge ${TYPE_BADGE[txn.type] || ''}`}>{txn.type}</span></td>
                    <td style={{ fontWeight: 600 }}>{txn.product_name}</td>
                    <td style={{ fontFamily: 'monospace' }}>{txn.quantity} {txn.unit}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '.8rem' }}>{txn.buy_price > 0 ? fmt(txn.buy_price) : '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '.8rem' }}>{txn.sell_price > 0 ? fmt(txn.sell_price) : '—'}</td>
                    <td>
                      {txn.profit_loss !== 0
                        ? <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '.82rem', color: isLoss ? 'var(--a3)' : 'var(--a4)' }}>
                            {isLoss ? '' : '+'}{fmt(txn.profit_loss)}
                          </span>
                        : <span style={{ color: 'var(--mt)' }}>—</span>
                      }
                    </td>
                    <td style={{ fontSize: '.75rem', color: 'var(--mt)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.notes || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagi">
            <span className="pagi-info">{filtered.length} records · Page {page}/{totalPages}</span>
            <div className="pagi-btns">
              <button className="pb" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`pb ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="pb" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
