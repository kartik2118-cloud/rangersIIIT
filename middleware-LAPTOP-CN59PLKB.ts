import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';

const PUBLIC_PAGES = ['/', '/login', '/register'];
const PUBLIC_API = ['/api/auth/login', '/api/auth/register', '/api/fests'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public pages
  if (PUBLIC_PAGES.includes(pathname)) return NextResponse.next();

  // Allow public API routes
  if (PUBLIC_API.includes(pathname)) return NextResponse.next();

  // Allow static files and Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const user = await getAuthUserFromRequest(req);

  // Protected API routes → 401
  if (pathname.startsWith('/api/')) {
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Protected pages → redirect to login
  if (!user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
