import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';

const publicRoutes = ['/login', '/api/auth/login'];
const partialAuthRoutes = ['/setup-2fa', '/api/auth/setup-2fa', '/api/auth/confirm-2fa', '/api/auth/verify-2fa'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('Permissions-Policy', 'camera=(),microphone=(),geolocation=()');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return response;
  }

  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return response;
  }

  if (pathname === '/api/auth/logout') {
    return response;
  }

  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.adminId) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { ok: false, error: 'Não autenticado' },
        { status: 401, headers: response.headers }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (partialAuthRoutes.some(route => pathname.startsWith(route))) {
    if (session.enrollmentPending || session.totpPending) {
      return response;
    }
  }

  if (session.enrollmentPending && !pathname.startsWith('/setup-2fa')) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { ok: false, error: 'Configuração 2FA necessária' },
        { status: 403, headers: response.headers }
      );
    }
    return NextResponse.redirect(new URL('/setup-2fa', request.url));
  }

  if (!session.totpVerified) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { ok: false, error: 'Não autenticado' },
        { status: 401, headers: response.headers }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session.expiresAt && Date.now() > session.expiresAt) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { ok: false, error: 'Sessão expirada' },
        { status: 401, headers: response.headers }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
