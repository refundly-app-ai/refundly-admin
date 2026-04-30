import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { findAdminById, verifyAdminPassword, isAccountLocked, incrementFailedAttempts } from '@/lib/db/admins';
import { logActivity } from '@/lib/audit';

const unlockSchema = z.object({
  password: z.string().min(1, 'Senha é obrigatória'),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';

    const session = await getSession();

    if (!session.adminId) {
      return NextResponse.json({ ok: false, error: 'Sessão inválida' }, { status: 401 });
    }

    const body = await request.json();
    const validation = unlockSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const admin = await findAdminById(session.adminId);

    if (!admin || !admin.is_active) {
      return NextResponse.json({ ok: false, error: 'Sessão inválida' }, { status: 401 });
    }

    if (isAccountLocked(admin)) {
      return NextResponse.json(
        { ok: false, error: 'Conta bloqueada por excesso de tentativas. Tente novamente em 15 minutos.' },
        { status: 423 }
      );
    }

    const isValid = await verifyAdminPassword(admin, validation.data.password);

    if (!isValid) {
      await incrementFailedAttempts(admin.id);
      return NextResponse.json({ ok: false, error: 'Senha incorreta' }, { status: 401 });
    }

    await logActivity({
      adminId: admin.id,
      action: 'session_unlocked',
      entity: 'auth',
      entityId: admin.id,
      ip,
      ua,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Unlock error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
