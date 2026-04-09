'use client'
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  loading: boolean
  login: (phone: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<{ error?: string }>
}

export interface RegisterData {
  // Step 1 — Business
  shopName: string; shopType: string; country: string
  stateDiv: string; city: string; address: string
  shopPhone: string; shopEmail: string
  // Step 2 — Owner
  ownerName: string; ownerPhone: string; ownerEmail: string
  nid: string; dob: string; gender: string
  // Step 3 — Credentials
  loginPhone: string; password: string
}

const AuthContext = createContext<AuthState>({
  user: null, loading: true,
  login: async () => ({}), logout: async () => {}, register: async () => ({})
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore session from localStorage (30-day session)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('digiboi_session')
      if (raw) {
        const sess = JSON.parse(atob(raw))
        if (sess.exp > Date.now()) {
          setUser({ id: sess.id, phone: sess.phone, shop_name: sess.sn, owner_name: sess.on, created_at: '' })
        } else {
          localStorage.removeItem('digiboi_session')
        }
      }
    } catch {}
    setLoading(false)
  }, [])

  const login = useCallback(async (phone: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    })
    const data = await res.json()
    if (!res.ok || data.error) return { error: data.error || 'Login failed' }
    setUser(data.user)
    // Save 30-day session
    const sess = { id: data.user.id, phone: data.user.phone, sn: data.user.shop_name, on: data.user.owner_name, exp: Date.now() + 30*24*3600*1000 }
    localStorage.setItem('digiboi_session', btoa(JSON.stringify(sess)))
    return {}
  }, [])

  const logout = useCallback(async () => {
    localStorage.removeItem('digiboi_session')
    setUser(null)
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await res.json()
    if (!res.ok || result.error) return { error: result.error || 'Registration failed' }
    // Auto-login after register
    return login(data.loginPhone, data.password)
  }, [login])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
