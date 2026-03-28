'use client'
import { useAuth } from './auth-context'
import type { InventoryItem, Transaction, DueLedgerEntry, Buyer } from '@/types'

export function useApi() {
  const { user } = useAuth()
  const uid = user?.id || ''

  const headers = () => ({ 'Content-Type': 'application/json', 'x-user-id': uid })

  // ── Inventory ──────────────────────────────────────────
  async function getInventory(): Promise<InventoryItem[]> {
    const res = await fetch('/api/inventory', { headers: headers() })
    const d = await res.json()
    return d.data || []
  }

  async function addProduct(data: Partial<InventoryItem>): Promise<InventoryItem> {
    const res = await fetch('/api/inventory', { method: 'POST', headers: headers(), body: JSON.stringify(data) })
    const d = await res.json()
    if (!res.ok) throw new Error(d.error)
    return d.data
  }

  async function updateProduct(id: string, data: Partial<InventoryItem>): Promise<InventoryItem> {
    const res = await fetch(`/api/inventory/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(data) })
    const d = await res.json()
    if (!res.ok) throw new Error(d.error)
    return d.data
  }

  async function deleteProduct(id: string): Promise<void> {
    const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE', headers: headers() })
    if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
  }

  // ── Transactions ────────────────────────────────────────
  async function getTransactions(limit = 100, offset = 0): Promise<{ data: Transaction[]; count: number }> {
    const res = await fetch(`/api/transactions?limit=${limit}&offset=${offset}`, { headers: headers() })
    const d = await res.json()
    return { data: d.data || [], count: d.count || 0 }
  }

  async function doTransaction(data: {
    product_id: string; product_name: string; txn_type: 'in' | 'out' | 'price'
    quantity: number; unit?: string; buy_price?: number; sell_price?: number
    notes?: string; new_buy_price?: number; new_sell_price?: number
  }): Promise<{ data: Transaction; new_qty: number; profit_loss: number }> {
    const res = await fetch('/api/transactions', { method: 'POST', headers: headers(), body: JSON.stringify(data) })
    const d = await res.json()
    if (!res.ok) throw new Error(d.error)
    return d
  }

  // ── Due Ledger ──────────────────────────────────────────
  async function getDueLedger(): Promise<DueLedgerEntry[]> {
    const res = await fetch('/api/due-ledger', { headers: headers() })
    const d = await res.json()
    return d.data || []
  }

  async function addDueEntry(data: Partial<DueLedgerEntry>): Promise<DueLedgerEntry> {
    const res = await fetch('/api/due-ledger', { method: 'POST', headers: headers(), body: JSON.stringify(data) })
    const d = await res.json()
    if (!res.ok) throw new Error(d.error)
    return d.data
  }

  async function updateDueEntry(id: string, data: Partial<DueLedgerEntry>): Promise<DueLedgerEntry> {
    const res = await fetch(`/api/due-ledger/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(data) })
    const d = await res.json()
    if (!res.ok) throw new Error(d.error)
    return d.data
  }

  async function deleteDueEntry(id: string): Promise<void> {
    const res = await fetch(`/api/due-ledger/${id}`, { method: 'DELETE', headers: headers() })
    if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
  }

  // ── Buyers ──────────────────────────────────────────────
  async function getBuyers(): Promise<Buyer[]> {
    const res = await fetch('/api/buyers', { headers: headers() })
    const d = await res.json()
    return d.data || []
  }

  async function addBuyer(data: Partial<Buyer>): Promise<Buyer> {
    const res = await fetch('/api/buyers', { method: 'POST', headers: headers(), body: JSON.stringify(data) })
    const d = await res.json()
    if (!res.ok) throw new Error(d.error)
    return d.data
  }

  async function updateBuyer(id: string, data: Partial<Buyer>): Promise<Buyer> {
    const res = await fetch(`/api/buyers/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(data) })
    const d = await res.json()
    if (!res.ok) throw new Error(d.error)
    return d.data
  }

  async function deleteBuyer(id: string): Promise<void> {
    const res = await fetch(`/api/buyers/${id}`, { method: 'DELETE', headers: headers() })
    if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
  }

  return { getInventory, addProduct, updateProduct, deleteProduct, getTransactions, doTransaction, getDueLedger, addDueEntry, updateDueEntry, deleteDueEntry, getBuyers, addBuyer, updateBuyer, deleteBuyer }
}
