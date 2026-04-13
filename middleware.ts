import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_API_ROUTES = ['/api/auth/login', '/api/auth/register']

function addHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return res
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!pathname.startsWith('/api/')) {
    return addHeaders(NextResponse.next())
  }

  if (PUBLIC_API_ROUTES.includes(pathname)) {
    return addHeaders(NextResponse.next())
  }

  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const dotIndex = token.lastIndexOf('.')
    if (dotIndex === -1) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const payloadB64 = token.slice(0, dotIndex)
    const sigB64 = token.slice(dotIndex + 1)

    const secret = process.env.JWT_SECRET || 'digiboi-dev-secret'
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const sigBytes = Uint8Array.from(
      atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    )

    const valid = await crypto.subtle.verify(
      'HMAC', key, sigBytes, new TextEncoder().encode(payloadB64)
    )

    if (!valid) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))

    if (!payload.uid || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const reqHeaders = new Headers(req.headers)
    reqHeaders.set('x-user-id', payload.uid)
    return addHeaders(NextResponse.next({ request: { headers: reqHeaders } }))

  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png).*)'],
}
