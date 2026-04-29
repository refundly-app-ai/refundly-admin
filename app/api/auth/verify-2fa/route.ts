import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { totpRateLimiter } from '@/lib/auth/rate-limit';
import { verifyTOTP } from '@/lib/auth/totp';
import { findAdminById, useRecoveryCode, updateAdminLastLogin } from '@/lib/mocks/admins';
import { logActivity } from '@/lib/audit';
import { getTempSession, updateTempSession } from '@/lib/auth/temp-store';

const verifySchema = z.object({
  code: z.string().min(6, 'Código inválido'),
  token: z.string().min(1, 'Token inválido'),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';
    
    const body = await request.json();
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { code, token } = validation.data;
    
    // Get session from temp store
    const session = getTempSession(token);

    if (!session || !session.totpPending) {
      return NextResponse.json(
        { ok: false, error: 'Sessão inválida ou expirada. Faça login novamente.' },
        { status: 401 }
      );
    }

    // Rate limiting
    const { success } = await totpRateLimiter.limit(session.adminId);
    if (!success) {
      return NextResponse.json(
        { ok: false, error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 }
      );
    }

    const admin = findAdminById(session.adminId);

    if (!admin || !admin.totpSecret) {
      return NextResponse.json(
        { ok: false, error: 'Configuração 2FA não encontrada' },
        { status: 400 }
      );
    }

    // MOCK: Accept "123456" as valid code for testing
    let isValid = false;
    let isRecoveryCode = false;

    if (code === '123456') {
      // Mock code for easy testing
      isValid = true;
    } else if (code.length === 6 && /^\d+$/.test(code)) {
      isValid = verifyTOTP(admin.totpSecret, code);
    } else if (code.length === 12) {
      // Try recovery code
      isValid = useRecoveryCode(admin.id, code);
      isRecoveryCode = true;
    }

    if (!isValid) {
      await logActivity({
        adminId: admin.id,
        action: '2fa_failed',
        entity: 'auth',
        entityId: admin.id,
        metadata: { isRecoveryCode },
        ip,
        ua,
      });
      return NextResponse.json(
        { ok: false, error: 'Código inválido' },
        { status: 401 }
      );
    }

    // Update session to verified
    updateTempSession(token, {
      totpVerified: true,
      totpPending: false,
    });

    updateAdminLastLogin(admin.id);

    await logActivity({
      adminId: admin.id,
      action: 'login_success',
      entity: 'auth',
      entityId: admin.id,
      metadata: { isRecoveryCode },
      ip,
      ua,
    });

    // Set auth cookie for middleware
    const response = NextResponse.json({
      ok: true,
      data: { 
        verified: true,
        token,
        recoveryCodeUsed: isRecoveryCode,
        remainingRecoveryCodes: isRecoveryCode ? admin.recoveryCodes.length : undefined,
      },
    });

    // Set cookie for future requests
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
