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
  shopName: string; shopType: string; country: string
  stateDiv: string; city: string; address: string
  shopPhone: string; shopEmail: string
  ownerName: string; ownerPhone: string; ownerEmail: string
  nid: string; dob: string; gender: string
  loginPhone: string; password: string
}

const SESSION_KEY = 'digiboi_session'

const AuthContext = createContext<AuthState>({
  user: null, loading: true,
  login: async () => ({}), logout: async () => {}, register: async () => ({}),
})

function decodeSession(token: string): { uid: string; phone: string; sn: string; on: string; exp: number } | null {
  try {
    const dotIndex = token.lastIndexOf('.')
    if (dotIndex === -1) return null
    const payloadB64 = token.slice(0, dotIndex)
    const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const token = localStorage.getItem(SESSION_KEY)
      if (token) {
        const p = decodeSession(token)
        if (p && p.exp > Math.floor(Date.now() / 1000)) {
          setUser({ id: p.uid, phone: p.phone, shop_name: p.sn, owner_name: p.on, created_at: '' })
        } else {
          localStorage.removeItem(SESSION_KEY)
        }
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  const login = useCallback(async (phone: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      const data = await res.json()
      if (!res.ok || data.error) return { error: data.error || 'Login failed' }
      localStorage.setItem(SESSION_KEY, data.token)
      setUser(data.user)
      return {}
    } catch {
      return { error: 'Network error. Check connection.' }
    }
  }, [])

  const logout = useCallback(async () => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  const register = useCallback(async (formData: RegisterData) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const result = await res.json()
      if (!res.ok || result.error) return { error: result.error || 'Registration failed' }
      return login(formData.loginPhone, formData.password)
    } catch {
      return { error: 'Network error. Check connection.' }
    }
  }, [login])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }

export function getStoredToken(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(SESSION_KEY) || ''
}
