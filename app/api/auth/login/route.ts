import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { loginRateLimiter } from '@/lib/auth/rate-limit';
import { findAdminByEmail, verifyAdminPassword } from '@/lib/mocks/admins';
import { logActivity } from '@/lib/audit';
import { createTempSession, generateToken } from '@/lib/auth/temp-store';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';

    // Rate limiting
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
    const admin = findAdminByEmail(email);

    if (!admin || !admin.isActive) {
      await logActivity({
        adminId: null,
        action: 'login_failed',
        entity: 'auth',
        entityId: null,
        metadata: { email, reason: 'user_not_found' },
        ip,
        ua,
      });
      return NextResponse.json(
        { ok: false, error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyAdminPassword(admin, password);
    if (!isValidPassword) {
      await logActivity({
        adminId: admin.id,
        action: 'login_failed',
        entity: 'auth',
        entityId: admin.id,
        metadata: { reason: 'invalid_password' },
        ip,
        ua,
      });
      return NextResponse.json(
        { ok: false, error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Generate session token
    const token = generateToken();

    // Check if TOTP is enabled
    if (admin.totpEnabled && admin.totpSecret) {
      createTempSession(token, {
        adminId: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        totpPending: true,
        totpVerified: false,
        enrollmentPending: false,
      });

      const response = NextResponse.json({
        ok: true,
        data: { requiresTotp: true, token },
      });
      
      return response;
    }

    // TOTP not enabled - redirect to setup
    createTempSession(token, {
      adminId: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      totpPending: false,
      totpVerified: false,
      enrollmentPending: true,
    });

    return NextResponse.json({
      ok: true,
      data: { requiresSetup: true, token },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
