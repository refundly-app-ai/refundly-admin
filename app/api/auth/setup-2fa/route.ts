import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { generateTOTPSecret } from '@/lib/auth/totp';
import { generateRecoveryCodes } from '@/lib/auth/password';
import { findAdminById } from '@/lib/db/admins';

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.adminId || !session.enrollmentPending) {
      return NextResponse.json({ ok: false, error: 'Sessão inválida' }, { status: 401 });
    }

    const admin = await findAdminById(session.adminId);
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Admin não encontrado' }, { status: 404 });
    }

    const { secret, uri } = generateTOTPSecret(admin.email);
    const recoveryCodes = generateRecoveryCodes(10);

    return NextResponse.json({
      ok: true,
      data: { secret, uri, recoveryCodes },
    });
  } catch (error) {
    console.error('Setup 2FA error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
