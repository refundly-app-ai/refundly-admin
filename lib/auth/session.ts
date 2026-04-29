import { getIronSession, SessionOptions, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export interface SessionData {
  adminId?: string;
  email?: string;
  fullName?: string;
  isLoggedIn: boolean;
  totpVerified: boolean;
  totpPending?: boolean;
  enrollmentPending?: boolean;
  expiresAt?: number;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_for_dev',
  cookieName: 'admin_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 8, // 8 hours
  },
};

// For Server Components / Server Actions
export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}

// For API Routes - takes request/response
export async function getSessionFromRequest(req: NextRequest, res: NextResponse): Promise<IronSession<SessionData>> {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  return session;
}

export async function createSession(data: Partial<SessionData>) {
  const session = await getSession();
  Object.assign(session, {
    ...data,
    isLoggedIn: true,
    expiresAt: Date.now() + 1000 * 60 * 60 * 8,
  });
  await session.save();
  return session;
}

export async function destroySession() {
  const session = await getSession();
  session.destroy();
}

export async function updateSession(data: Partial<SessionData>) {
  const session = await getSession();
  Object.assign(session, data);
  await session.save();
  return session;
}
