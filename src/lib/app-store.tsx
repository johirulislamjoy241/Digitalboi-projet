'use client'
import { createContext,useContext,useState,useCallback,useEffect,ReactNode } from 'react'
import type { InventoryItem,Transaction,DueLedgerEntry,Buyer } from '@/types'
import type { Lang } from './i18n'

export type ActiveSection='dashboard'|'inventory'|'transactions'|'txhistory'|'reports'|'dueledger'|'settings'|'security'|'privacy'|'disclaimer'|'terms'|'directions'

interface AS{
  activeSection:ActiveSection;setActiveSection:(s:ActiveSection)=>void
  sidebarOpen:boolean;setSidebarOpen:(v:boolean)=>void;toggleSidebar:()=>void
  theme:'dark'|'light';setTheme:(t:'dark'|'light')=>void
  lang:Lang;setLang:(l:Lang)=>void
  currency:string;setCurrency:(c:string)=>void
  lowStockThreshold:number;setLowStockThreshold:(n:number)=>void
  inventory:InventoryItem[];setInventory:(i:InventoryItem[])=>void
  transactions:Transaction[];setTransactions:(t:Transaction[])=>void
  dueLedger:DueLedgerEntry[];setDueLedger:(e:DueLedgerEntry[])=>void
  buyers:Buyer[];setBuyers:(b:Buyer[])=>void
}
const Ctx=createContext<AS>({} as AS)

export function AppProvider({children}:{children:ReactNode}){
  const [activeSection,setActiveSection]=useState<ActiveSection>('dashboard')
  const [sidebarOpen,setSidebarOpen]=useState(false)
  const [theme,setThemeState]=useState<'dark'|'light'>('light')
  const [lang,setLangState]=useState<Lang>('en')
  const [currency,setCurrencyState]=useState('BDT')
  const [lowStockThreshold,setLST]=useState(10)
  const [inventory,setInventory]=useState<InventoryItem[]>([])
  const [transactions,setTransactions]=useState<Transaction[]>([])
  const [dueLedger,setDueLedger]=useState<DueLedgerEntry[]>([])
  const [buyers,setBuyers]=useState<Buyer[]>([])

  useEffect(()=>{
    try{
      const th=localStorage.getItem('db_theme') as 'dark'|'light'|null
      const lg=localStorage.getItem('db_lang') as Lang|null
      const cu=localStorage.getItem('db_currency')
      const tr=localStorage.getItem('db_threshold')
      applyTheme(th||'light')
      if(lg)setLangState(lg)
      if(cu)setCurrencyState(cu)
      if(tr)setLST(parseInt(tr)||10)
    }catch{applyTheme('light')}
  },[])

  function applyTheme(t:'dark'|'light'){
    setThemeState(t)
    if(typeof document!=='undefined')document.documentElement.setAttribute('data-theme',t)
    try{localStorage.setItem('db_theme',t)}catch{}
  }

  const setTheme=useCallback((t:'dark'|'light')=>applyTheme(t),[])
  const toggleSidebar=useCallback(()=>setSidebarOpen(v=>!v),[])
  const setLang=useCallback((l:Lang)=>{setLangState(l);try{localStorage.setItem('db_lang',l)}catch{}},[])
  const setCurrency=useCallback((c:string)=>{setCurrencyState(c);try{localStorage.setItem('db_currency',c)}catch{}},[])
  const setLowStockThreshold=useCallback((n:number)=>{setLST(n);try{localStorage.setItem('db_threshold',String(n))}catch{}},[])

  return(
    <Ctx.Provider value={{
      activeSection,setActiveSection,sidebarOpen,setSidebarOpen,toggleSidebar,
      theme,setTheme,lang,setLang,currency,setCurrency,
      lowStockThreshold,setLowStockThreshold,
      inventory,setInventory,transactions,setTransactions,
      dueLedger,setDueLedger,buyers,setBuyers,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAppStore(){return useContext(Ctx)}
