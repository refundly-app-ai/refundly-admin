import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

interface SessionData {
  adminId?: string;
  email?: string;
  fullName?: string;
  isLoggedIn: boolean;
  totpVerified: boolean;
  totpPending?: boolean;
  enrollmentPending?: boolean;
  expiresAt?: number;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_for_dev',
  cookieName: '__Host-pa_sess',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
  },
};

// Routes that don't require authentication
const publicRoutes = ['/login', '/api/auth/login'];

// Routes that require partial auth (2FA pending or enrollment)
const partialAuthRoutes = ['/setup-2fa', '/api/auth/setup-2fa', '/api/auth/confirm-2fa', '/api/auth/verify-2fa'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Add security headers to all responses
  const response = NextResponse.next();
  
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('Permissions-Policy', 'camera=(),microphone=(),geolocation=()');
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Skip middleware for static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return response;
  }

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return response;
  }

  // Allow logout endpoint
  if (pathname === '/api/auth/logout') {
    return response;
  }

  // Get session
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  // No session at all - redirect to login
  if (!session.adminId) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { ok: false, error: 'Não autenticado', status: 401 },
        { status: 401, headers: response.headers }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Allow partial auth routes for users in enrollment or 2FA pending state
  if (partialAuthRoutes.some(route => pathname.startsWith(route))) {
    if (session.enrollmentPending || session.totpPending) {
      return response;
    }
  }

  // User needs to setup 2FA
  if (session.enrollmentPending && !pathname.startsWith('/setup-2fa')) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { ok: false, error: 'Configuração 2FA necessária', status: 403 },
        { status: 403, headers: response.headers }
      );
    }
    return NextResponse.redirect(new URL('/setup-2fa', request.url));
  }

  // User needs to verify 2FA
  if (session.totpPending && !session.totpVerified) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { ok: false, error: 'Verificação 2FA necessária', status: 403 },
        { status: 403, headers: response.headers }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Session not fully verified
  if (!session.totpVerified) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { ok: false, error: 'Não autenticado', status: 401 },
        { status: 401, headers: response.headers }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check session expiration
  if (session.expiresAt && Date.now() > session.expiresAt) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { ok: false, error: 'Sessão expirada', status: 401 },
        { status: 401, headers: response.headers }
      );
    }
    return NextResponse.redirect(new URL('/locked', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
