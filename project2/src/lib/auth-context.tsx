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

const AuthContext = createContext<AuthState>({
  user: null, loading: true,
  login: async () => ({}), logout: async () => {}, register: async () => ({})
})

const SESSION_KEY = 'dgb_s'
const SESSION_DAYS = 30

// Fix #13: simple obfuscation — not cryptographic but avoids plain JSON
function encodeSession(data: object): string {
  const json = JSON.stringify(data)
  // XOR-based encoding with a fixed key to avoid plain base64
  const key = 'dgb2024'
  const encoded = Array.from(json).map((c, i) =>
    String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join('')
  return btoa(encoded)
}

function decodeSession(raw: string): object | null {
  try {
    const key = 'dgb2024'
    const decoded = atob(raw)
    const json = Array.from(decoded).map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    ).join('')
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
      const raw = localStorage.getItem(SESSION_KEY)
      if (raw) {
        // Fix #13: decode with XOR obfuscation
        const sess = decodeSession(raw) as { id: string; ph: string; sn: string; on: string; exp: number } | null
        if (sess && sess.exp > Date.now()) {
          setUser({ id: sess.id, phone: sess.ph, shop_name: sess.sn, owner_name: sess.on, created_at: '' })
        } else {
          localStorage.removeItem(SESSION_KEY)
        }
      }
    } catch {
      localStorage.removeItem(SESSION_KEY)
    }
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
    // Fix #13: store with XOR encoding
    const sess = {
      id: data.user.id, ph: data.user.phone,
      sn: data.user.shop_name, on: data.user.owner_name,
      exp: Date.now() + SESSION_DAYS * 24 * 3600 * 1000
    }
    localStorage.setItem(SESSION_KEY, encodeSession(sess))
    return {}
  }, [])

  const logout = useCallback(async () => {
    localStorage.removeItem(SESSION_KEY)
    // Also clear old session key if exists
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
    return login(data.loginPhone, data.password)
  }, [login])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
