import { NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/auth/login', '/auth/register', '/auth/forgot-password',
  '/api/auth/', '/api/setup',
];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  const isStatic = pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/icon') || pathname.startsWith('/manifest');

  if (isStatic || isPublic) return NextResponse.next();

  const token = request.cookies.get('digiboi_token')?.value;
  const authHeader = request.headers.get('authorization');
  const hasToken = token || (authHeader?.startsWith('Bearer ') && authHeader.length > 15);

  if (pathname.startsWith('/api/') && !hasToken)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!pathname.startsWith('/api/') && !hasToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icon).*)'],
};
