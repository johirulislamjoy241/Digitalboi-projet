import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Security headers on all responses
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  const { pathname } = req.nextUrl

  // Protect all /api/* routes except public ones
  if (pathname.startsWith('/api/')) {
    if (PUBLIC_API_ROUTES.includes(pathname)) return res

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
    }

    // Forward the verified user ID as a trusted header to API routes
    const forwarded = NextResponse.next()
    Object.entries({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    }).forEach(([k, v]) => forwarded.headers.set(k, v))

    // Attach verified user id for downstream API routes
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-id', payload.sub)

    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png).*)',
  ],
}
