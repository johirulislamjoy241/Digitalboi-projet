'use client'
import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'

type ToastType = 'ok' | 'er' | 'wa' | 'in'
interface Toast { id: number; msg: string; type: ToastType }
interface ToastCtx { toast: (msg: string, type?: ToastType) => void }
const ToastContext = createContext<ToastCtx>({ toast: () => {} })

const ICONS: Record<ToastType, string> = { ok: '✅', er: '❌', wa: '⚠️', in: 'ℹ️' }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const toast = useCallback((msg: string, type: ToastType = 'in') => {
    const id = ++counter.current
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{ICONS[t.type]}</span>
            <span style={{ flex: 1 }}>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() { return useContext(ToastContext) }
