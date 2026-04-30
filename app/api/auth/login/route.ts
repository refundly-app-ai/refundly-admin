import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { loginRateLimiter } from '@/lib/auth/rate-limit';
import { findAdminByEmail, verifyAdminPassword, isAccountLocked, incrementFailedAttempts } from '@/lib/db/admins';
import { logActivity } from '@/lib/audit';
import { createSession } from '@/lib/auth/session';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';

    const { success } = await loginRateLimiter.limit(ip);
    if (!success) {
      return NextResponse.json(
        { ok: false, error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    const admin = await findAdminByEmail(email);

    if (!admin || !admin.is_active) {
      await logActivity({ adminId: null, action: 'login_failed', entity: 'auth', entityId: null, metadata: { email, reason: 'user_not_found' }, ip, ua });
      return NextResponse.json({ ok: false, error: 'Credenciais inválidas' }, { status: 401 });
    }

    if (isAccountLocked(admin)) {
      return NextResponse.json(
        { ok: false, error: 'Conta bloqueada por excesso de tentativas. Tente novamente em 15 minutos.' },
        { status: 423 }
      );
    }

    const isValidPassword = await verifyAdminPassword(admin, password);
    if (!isValidPassword) {
      await incrementFailedAttempts(admin.id);
      await logActivity({ adminId: admin.id, action: 'login_failed', entity: 'auth', entityId: admin.id, metadata: { reason: 'invalid_password' }, ip, ua });
      return NextResponse.json({ ok: false, error: 'Credenciais inválidas' }, { status: 401 });
    }

    if (admin.totp_enabled && admin.totp_secret) {
      await createSession({
        adminId: admin.id,
        email: admin.email,
        fullName: admin.full_name,
        totpPending: true,
        totpVerified: false,
        enrollmentPending: false,
        isLoggedIn: false,
      });
      return NextResponse.json({ ok: true, data: { requiresTotp: true } });
    }

    await createSession({
      adminId: admin.id,
      email: admin.email,
      fullName: admin.full_name,
      totpPending: false,
      totpVerified: false,
      enrollmentPending: true,
      isLoggedIn: false,
    });
    return NextResponse.json({ ok: true, data: { requiresSetup: true } });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
