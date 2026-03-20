'use client'
import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'

type ToastType = 'ok' | 'er' | 'wa' | 'in'
interface Toast { id: number; msg: string; type: ToastType }

interface ToastCtx { toast: (msg: string, type?: ToastType) => void }
const ToastContext = createContext<ToastCtx>({ toast: () => {} })

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
          <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() { return useContext(ToastContext) }
