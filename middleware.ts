import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';

const PUBLIC_PAGES = ['/', '/login', '/register'];
const PUBLIC_API = ['/api/auth/login', '/api/auth/register', '/api/auth/firebase', '/api/fests'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pass through Next.js internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons')
  ) {
    return NextResponse.next();
  }

  // Public pages and public API routes need no auth
  if (PUBLIC_PAGES.includes(pathname) || PUBLIC_API.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const user = await getAuthUserFromRequest(req);

  // Protected API: return 401 JSON
  if (pathname.startsWith('/api/')) {
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Protected pages: redirect to login
  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
