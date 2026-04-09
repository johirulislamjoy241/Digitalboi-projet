import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  // Only API routes need protection — page is a SPA that handles auth client-side
  // This middleware just adds security headers to all responses
  const res = NextResponse.next()

  // Security headers
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return res
}

export const config = {
  matcher: [
    // Match all routes except static files and Next internals
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png).*)',
  ],
}
