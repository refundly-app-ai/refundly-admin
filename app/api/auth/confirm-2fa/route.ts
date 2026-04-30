import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession, updateSession } from '@/lib/auth/session';
import { verifyTOTP } from '@/lib/auth/totp';
import { encryptSecret } from '@/lib/auth/crypto';
import { findAdminById, updateAdminTOTP, updateAdminLastLogin } from '@/lib/db/admins';
import { logActivity } from '@/lib/audit';

const confirmSchema = z.object({
  secret: z.string().min(16, 'Secret inválido'),
  code: z.string().length(6, 'Código deve ter 6 dígitos'),
  recoveryCodes: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';
    const session = await getSession();

    if (!session.adminId || !session.enrollmentPending) {
      return NextResponse.json({ ok: false, error: 'Sessão inválida' }, { status: 401 });
    }

    const body = await request.json();
    const validation = confirmSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ ok: false, error: validation.error.errors[0].message }, { status: 400 });
    }

    const { secret, code, recoveryCodes } = validation.data;
    const admin = await findAdminById(session.adminId);

    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Admin não encontrado' }, { status: 404 });
    }

    const isValid = verifyTOTP(secret, code);
    if (!isValid) {
      return NextResponse.json({ ok: false, error: 'Código inválido. Verifique seu aplicativo autenticador.' }, { status: 400 });
    }

    const encryptedSecret = await encryptSecret(secret);
    await updateAdminTOTP(admin.id, encryptedSecret, recoveryCodes);
    await updateAdminLastLogin(admin.id);
    await updateSession({ totpVerified: true, enrollmentPending: false, isLoggedIn: true, expiresAt: Date.now() + 8 * 60 * 60 * 1000 });
    await logActivity({ adminId: admin.id, action: '2fa_enabled', entity: 'admin', entityId: admin.id, metadata: { method: 'totp' }, ip, ua });

    return NextResponse.json({ ok: true, data: { enabled: true } });
  } catch (error) {
    console.error('Confirm 2FA error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
