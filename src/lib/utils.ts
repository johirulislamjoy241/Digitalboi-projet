import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const CURRENCIES: Record<string, { symbol: string; name: string; decimals: number }> = {
  BDT: { symbol: '৳', name: 'Bangladeshi Taka', decimals: 0 },
  USD: { symbol: '$', name: 'US Dollar', decimals: 2 },
  EUR: { symbol: '€', name: 'Euro', decimals: 2 },
  GBP: { symbol: '£', name: 'British Pound', decimals: 2 },
  INR: { symbol: '₹', name: 'Indian Rupee', decimals: 2 },
  SAR: { symbol: '﷼', name: 'Saudi Riyal', decimals: 2 },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', decimals: 2 },
}

export function formatCurrency(value: number, currency = 'BDT'): string {
  const cur = CURRENCIES[currency] || CURRENCIES.BDT
  const formatted = Math.abs(value).toLocaleString('en-BD', {
    minimumFractionDigits: cur.decimals,
    maximumFractionDigits: cur.decimals,
  })
  return `${cur.symbol}${formatted}`
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatDateShort(date: string | Date): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function getStockStatus(qty: number, threshold = 10): 'In Stock' | 'Low Stock' | 'Out of Stock' {
  if (qty <= 0) return 'Out of Stock'
  if (qty <= threshold) return 'Low Stock'
  return 'In Stock'
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'In Stock':     return 'badge-stock-in'
    case 'Low Stock':    return 'badge-stock-low'
    case 'Out of Stock': return 'badge-stock-out'
    case 'Archived':     return 'badge-stock-arch'
    case 'Pending':      return 'badge-due-pending'
    case 'Partial':      return 'badge-due-partial'
    case 'Paid':         return 'badge-due-paid'
    case 'Overdue':      return 'badge-due-overdue'
    default:             return 'badge-stock-arch'
  }
}

export function escHtml(str: string): string {
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m] || m))
}

export const CHART_COLORS = [
  '#6366f1','#10b981','#f59e0b','#f43f5e','#8b5cf6',
  '#06b6d4','#ec4899','#84cc16','#fb923c','#a78bfa'
]

export const UNITS = ['pcs','kg','g','litre','ml','box','pack','pair','set','roll','bag','bottle','dozen']

export const CATEGORIES = [
  'Electronics','Clothing','Food & Beverage','Furniture',
  'Books','Stationery','Medicine','Cosmetics','Hardware',
  'Toys','Sports','Automotive','Agriculture','General'
]

export function bdTimeGreeting(): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Wishing you a peaceful morning 🌅'
  if (h >= 12 && h < 17) return 'Wishing you a peaceful afternoon ☀️'
  if (h >= 17 && h < 21) return 'Wishing you a peaceful evening 🌆'
  return 'Wishing you a peaceful night 🌙'
}
