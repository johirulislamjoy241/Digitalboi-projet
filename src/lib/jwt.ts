/**
 * Lightweight JWT helper using the Web Crypto API (Edge-compatible, no external deps).
 * Algorithm: HS256
 *
 * Environment variable required:
 *   JWT_SECRET — at least 32 random characters
 */

const ALG = 'HS256'
const SECRET_ENV = process.env.JWT_SECRET || ''
const EXPIRES_IN_SECONDS = 30 * 24 * 60 * 60 // 30 days

if (!SECRET_ENV && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is not set.')
}

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

function b64url(buf: ArrayBuffer): string {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function fromB64url(str: string): Buffer {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}

export interface JWTPayload {
  sub: string
  phone: string
  shop_name: string
  owner_name: string
  iat?: number
  exp?: number
}

export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const key = await getKey(SECRET_ENV)
  const enc = new TextEncoder()

  const header = b64url(enc.encode(JSON.stringify({ alg: ALG, typ: 'JWT' })))
  const now = Math.floor(Date.now() / 1000)
  const claims: JWTPayload = { ...payload, iat: now, exp: now + EXPIRES_IN_SECONDS }
  const body = b64url(enc.encode(JSON.stringify(claims)))

  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${body}`))
  return `${header}.${body}.${b64url(sig)}`
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [header, body, sig] = parts
    const key = await getKey(SECRET_ENV)
    const enc = new TextEncoder()

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromB64url(sig),
      enc.encode(`${header}.${body}`)
    )
    if (!valid) return null

    const payload: JWTPayload = JSON.parse(fromB64url(body).toString('utf-8'))
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) return null

    return payload
  } catch {
    return null
  }
}
