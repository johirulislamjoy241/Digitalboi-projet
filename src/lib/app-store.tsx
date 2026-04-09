'use client'
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import type { InventoryItem, Transaction, DueLedgerEntry, Buyer } from '@/types'
import type { Lang } from './i18n'

export type ActiveSection =
  | 'dashboard' | 'inventory' | 'pos' | 'transactions' | 'txhistory'
  | 'reports' | 'dueledger' | 'settings' | 'security' | 'privacy'
  | 'disclaimer' | 'terms' | 'directions'

interface AppStoreState {
  activeSection: ActiveSection
  setActiveSection: (s: ActiveSection) => void
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
  toggleSidebar: () => void
  theme: 'dark' | 'light'
  setTheme: (t: 'dark' | 'light') => void
  lang: Lang
  setLang: (l: Lang) => void
  currency: string
  setCurrency: (c: string) => void
  lowStockThreshold: number
  setLowStockThreshold: (n: number) => void
  inventory: InventoryItem[]
  setInventory: (i: InventoryItem[]) => void
  transactions: Transaction[]
  setTransactions: (t: Transaction[]) => void
  dueLedger: DueLedgerEntry[]
  setDueLedger: (e: DueLedgerEntry[]) => void
  buyers: Buyer[]
  setBuyers: (b: Buyer[]) => void
}

const AppStoreContext = createContext<AppStoreState>({} as AppStoreState)

function applyThemeToDOM(theme: 'dark' | 'light') {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setThemeState] = useState<'dark' | 'light'>('light')
  const [lang, setLangState] = useState<Lang>('en')
  const [currency, setCurrencyState] = useState('BDT')
  const [lowStockThreshold, setLSTState] = useState(10)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [dueLedger, setDueLedger] = useState<DueLedgerEntry[]>([])
  const [buyers, setBuyers] = useState<Buyer[]>([])

  // Restore persisted settings on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('db_theme') as 'dark' | 'light' | null
      const savedLang = localStorage.getItem('db_lang') as Lang | null
      const savedCurrency = localStorage.getItem('db_currency')
      const savedThreshold = localStorage.getItem('db_threshold')

      const resolvedTheme = savedTheme || 'light'
      setThemeState(resolvedTheme)
      applyThemeToDOM(resolvedTheme)

      if (savedLang) setLangState(savedLang)
      if (savedCurrency) setCurrencyState(savedCurrency)
      if (savedThreshold) setLSTState(parseInt(savedThreshold) || 10)
    } catch {
      applyThemeToDOM('light')
    }
  }, [])

  const setTheme = useCallback((t: 'dark' | 'light') => {
    setThemeState(t)
    applyThemeToDOM(t)
    try { localStorage.setItem('db_theme', t) } catch { /* ignore */ }
  }, [])

  const toggleSidebar = useCallback(() => setSidebarOpen(v => !v), [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem('db_lang', l) } catch { /* ignore */ }
  }, [])

  const setCurrency = useCallback((c: string) => {
    setCurrencyState(c)
    try { localStorage.setItem('db_currency', c) } catch { /* ignore */ }
  }, [])

  const setLowStockThreshold = useCallback((n: number) => {
    setLSTState(n)
    try { localStorage.setItem('db_threshold', String(n)) } catch { /* ignore */ }
  }, [])

  return (
    <AppStoreContext.Provider
      value={{
        activeSection, setActiveSection,
        sidebarOpen, setSidebarOpen, toggleSidebar,
        theme, setTheme,
        lang, setLang,
        currency, setCurrency,
        lowStockThreshold, setLowStockThreshold,
        inventory, setInventory,
        transactions, setTransactions,
        dueLedger, setDueLedger,
        buyers, setBuyers,
      }}
    >
      {children}
    </AppStoreContext.Provider>
  )
}

export function useAppStore() { return useContext(AppStoreContext) }
