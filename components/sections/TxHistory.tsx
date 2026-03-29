'use client'
import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '@/lib/app-store'
import { useApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Search, RefreshCw, Calendar } from 'lucide-react'

export default function TxHistorySection() {
  const { transactions, setTransactions, currency } = useAppStore()
  const api = useApi()
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all')
  const fmt = (v: number) => formatCurrency(v, currency)

  async function load() { setLoading(true); const r = await api.getTransactions(200); setTransactions(r.data); setLoading(false) }
  useEffect(() => { if (transactions.length === 0) load() }, []) // eslint-disable-line

  const filtered = useMemo(() => {
    let r = transactions
    if (filter !== 'all') r = r.filter(t => t.txn_type === filter)
    if (search) r = r.filter(t => t.product_name.toLowerCase().includes(search.toLowerCase()) || t.notes?.toLowerCase().includes(search.toLowerCase()))
    return r
  }, [transactions, filter, search])

  const totalProfit = filtered.filter(t => t.profit_loss > 0).reduce((s, t) => s + t.profit_loss, 0)
  const totalLoss = filtered.filter(t => t.profit_loss < 0).reduce((s, t) => s + Math.abs(t.profit_loss), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Summary */}
      <div className="grid-2 anim-fade-up">
        <div className="kpi-card" style={{ '--kpi-color': 'var(--success)' } as React.CSSProperties}>
          <div className="kpi-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
            <TrendingUp size={18} />
          </div>
          <div className="kpi-value">{fmt(totalProfit)}</div>
          <div className="kpi-label">মোট লাভ</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-color': 'var(--danger)' } as React.CSSProperties}>
          <div className="kpi-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
            <TrendingDown size={18} />
          </div>
          <div className="kpi-value">{fmt(totalLoss)}</div>
          <div className="kpi-label">মোট ক্ষতি</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card card-p anim-fade-up anim-d1">
        <div className="search-bar" style={{ marginBottom: 10 }}>
          <Search size={15} color="var(--text3)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="পণ্য বা নোট খুঁজুন..." />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 0 }}>✕</button>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {(['all', 'out', 'in'] as const).map(f => (
            <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'সব' : f === 'out' ? '💸 বিক্রয়' : '📥 ইন'}
            </button>
          ))}
          <button className="btn btn-ghost btn-xs" onClick={load} style={{ marginLeft: 'auto' }}>
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="card anim-fade-up anim-d2">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">কোনো লেনদেন নেই</div>
            <div className="empty-sub">ফিল্টার পরিবর্তন করুন</div>
          </div>
        ) : filtered.slice(0, 100).map((tx, i) => (
          <div key={tx.id} className="list-item" style={{ animationDelay: `${i * 0.02}s` }}>
            <div className="list-icon" style={{
              background: tx.txn_type === 'in' ? 'var(--success-light)' : 'var(--danger-light)',
              color: tx.txn_type === 'in' ? 'var(--success)' : 'var(--danger)'
            }}>
              {tx.txn_type === 'in' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </div>
            <div className="list-info">
              <div className="list-title">{tx.product_name}</div>
              <div className="list-sub">
                {tx.quantity} {tx.unit}
                {tx.notes && <span> · {tx.notes}</span>}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Calendar size={10} /> {new Date(tx.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <div className="list-right">
              {tx.txn_type === 'out' && (
                <span style={{ fontSize: '0.88rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: tx.profit_loss >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {tx.profit_loss >= 0 ? '+' : ''}{fmt(tx.profit_loss)}
                </span>
              )}
              <span className={`badge ${tx.txn_type === 'in' ? 'badge-success' : 'badge-danger'}`}>
                {tx.txn_type === 'in' ? 'ইন' : 'আউট'}
              </span>
            </div>
          </div>
        ))}
        {filtered.length > 100 && (
          <div style={{ textAlign: 'center', padding: '12px', fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--font-bn)' }}>
            প্রথম ১০০টি দেখানো হচ্ছে ({filtered.length} মোট)
          </div>
        )}
      </div>
    </div>
  )
}
