export interface User {
  id: string
  phone: string
  shop_name: string
  owner_name: string
  created_at: string
}

export interface InventoryItem {
  id: string
  user_id: string
  name: string
  category: string
  quantity: number
  unit: string
  buy_price: number
  sell_price: number
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Archived'
  notes?: string
  image_url?: string
  product_link?: string
  profit: number
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  product_id?: string
  product_name: string
  type: 'Stock In' | 'Stock Out' | 'Price Update' | 'Due Payment' | 'Loss'
  txn_type: 'in' | 'out' | 'price' | 'payment'
  quantity: number
  unit: string
  buy_price: number
  sell_price: number
  profit_loss: number
  old_qty: number
  new_qty: number
  notes?: string
  date: string
  created_at: string
}

export interface DueLedgerEntry {
  id: string
  user_id: string
  buyer_id?: string
  buyer_name: string
  product_id?: string
  product_name?: string
  quantity: number
  unit: string
  unit_price: number
  total_amount: number
  paid_amount: number
  remaining: number
  status: 'Pending' | 'Partial' | 'Paid'
  due_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Buyer {
  id: string
  user_id: string
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  created_at: string
}

export interface DashboardStats {
  totalProducts: number
  totalStockValue: number
  lowStockCount: number
  outOfStockCount: number
  todayProfit: number
  todayLoss: number
  totalDue: number
  totalTransactions: number
}

export type TxnMode = 'in' | 'out'
export type DueTab = 'all' | 'pending' | 'partial' | 'overdue' | 'paid' | 'buyers'
export type Theme = 'dark' | 'light'
export type Currency = 'BDT' | 'USD' | 'EUR' | 'GBP' | 'INR' | 'SAR' | 'AED'
