import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Security headers on all responses
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  }

  if (pathname.startsWith('/api/')) {
    if (PUBLIC_API_ROUTES.includes(pathname)) {
      const res = NextResponse.next()
      Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v))
      return res
    }

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
    }

    // Forward verified user ID to API routes
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-id', payload.sub)
    const res = NextResponse.next({ request: { headers: requestHeaders } })
    Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }

  const res = NextResponse.next()
  Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v))
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png).*)',
  ],
}
