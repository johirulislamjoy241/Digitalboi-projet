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

const SESSION_KEY = 'digiboi_token'

const AuthContext = createContext<AuthState>({
  user: null, loading: true,
  login: async () => ({}), logout: async () => {}, register: async () => ({}),
})

function decodeTokenPayload(token: string): { sub: string; phone: string; shop_name: string; owner_name: string; exp: number } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8'))
    return payload
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
        const payload = decodeTokenPayload(token)
        if (payload && payload.exp > Math.floor(Date.now() / 1000)) {
          setUser({ id: payload.sub, phone: payload.phone, shop_name: payload.shop_name, owner_name: payload.owner_name, created_at: '' })
        } else {
          localStorage.removeItem(SESSION_KEY)
        }
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  const login = useCallback(async (phone: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    })
    const data = await res.json()
    if (!res.ok || data.error) return { error: data.error || 'Login failed' }

    const tokenRes = await fetch('/api/auth/token', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: data.user.id }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenRes.ok || !tokenData.token) return { error: 'Session error. Try again.' }

    localStorage.setItem(SESSION_KEY, tokenData.token)
    setUser(data.user)
    return {}
  }, [])

  const logout = useCallback(async () => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok || result.error) return { error: result.error || 'Registration failed' }
    return login(data.loginPhone, data.password)
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
