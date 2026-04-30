import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { totpRateLimiter } from '@/lib/auth/rate-limit';
import { verifyTOTP } from '@/lib/auth/totp';
import { findAdminById, getDecryptedTotpSecret, useRecoveryCode, updateAdminLastLogin } from '@/lib/db/admins';
import { logActivity } from '@/lib/audit';
import { getSession, updateSession } from '@/lib/auth/session';

const verifySchema = z.object({
  code: z.string().min(6, 'Código inválido'),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';

    const session = await getSession();

    if (!session.adminId || !session.totpPending) {
      return NextResponse.json(
        { ok: false, error: 'Sessão inválida. Faça login novamente.' },
        { status: 401 }
      );
    }

    const { success } = await totpRateLimiter.limit(session.adminId);
    if (!success) {
      return NextResponse.json(
        { ok: false, error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ ok: false, error: validation.error.errors[0].message }, { status: 400 });
    }

    const { code } = validation.data;
    const admin = await findAdminById(session.adminId);

    if (!admin || !admin.totp_secret) {
      return NextResponse.json({ ok: false, error: 'Configuração 2FA não encontrada' }, { status: 400 });
    }

    let isValid = false;
    let isRecoveryCode = false;

    if (code.length === 6 && /^\d+$/.test(code)) {
      const secret = await getDecryptedTotpSecret(admin);
      if (secret) isValid = verifyTOTP(secret, code);
    } else if (code.length === 12) {
      isValid = await useRecoveryCode(admin.id, code);
      isRecoveryCode = true;
    }

    if (!isValid) {
      await logActivity({ adminId: admin.id, action: '2fa_failed', entity: 'auth', entityId: admin.id, metadata: { isRecoveryCode }, ip, ua });
      return NextResponse.json({ ok: false, error: 'Código inválido' }, { status: 401 });
    }

    await updateSession({ totpVerified: true, totpPending: false, isLoggedIn: true, expiresAt: Date.now() + 8 * 60 * 60 * 1000 });
    await updateAdminLastLogin(admin.id);
    await logActivity({ adminId: admin.id, action: 'login_success', entity: 'auth', entityId: admin.id, metadata: { isRecoveryCode }, ip, ua });

    return NextResponse.json({
      ok: true,
      data: { verified: true, recoveryCodeUsed: isRecoveryCode },
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
