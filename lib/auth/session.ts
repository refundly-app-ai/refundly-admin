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

// Use __Host- prefix in production (enforces Secure + Path=/), plain name in dev
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_for_dev',
  cookieName: process.env.NODE_ENV === 'production' ? '__Host-pa_sess' : 'pa_sess',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 8, // 8 hours
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function getSessionFromRequest(req: NextRequest, res: NextResponse): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(req, res, sessionOptions);
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
