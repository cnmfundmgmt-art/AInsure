/**
 * CFP Malaysia — Middleware
 * Route protection based on auth status, verification level, and role
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/', '/login', '/register', '/verification-pending', '/admin/login', '/advisor-pending'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionId = req.cookies.get('cfp_session')?.value;
  const role = req.cookies.get('cfp_role')?.value;
  const isVerified = req.cookies.get('cfp_verified')?.value === 'true';

  // Allow public routes
  if (PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    return NextResponse.next();
  }

  // ─── Not logged in ─────────────────────────────────────────────────────────
  if (!sessionId) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ─── Admin routes: require admin role ─────────────────────────────────────
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    return NextResponse.next();
  }

  // ─── Advisor routes: require advisor or admin role ────────────────────────
  // (approvedByAdmin check is done server-side in each route/page)
  if (pathname.startsWith('/advisor')) {
    if (role !== 'advisor' && role !== 'admin') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return NextResponse.next();
  }

  // ─── Advisor pending page: allow logged-in users, block anonymous ───────────
  if (pathname === '/advisor-pending') {
    if (!sessionId) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return NextResponse.next();
  }

  // ─── Dashboard routes: require verified status ───────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!isVerified) {
      return NextResponse.redirect(new URL('/verification-pending', req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
