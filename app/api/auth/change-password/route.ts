import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { findAdminById, verifyAdminPassword } from '@/lib/db/admins';
import { hashPassword } from '@/lib/auth/password';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/audit';

const schema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(8, 'Nova senha deve ter no mínimo 8 caracteres'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.adminId || !session.totpVerified) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const validation = schema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;

    const admin = await findAdminById(session.adminId);
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Admin não encontrado' }, { status: 404 });
    }

    const isValid = await verifyAdminPassword(admin, currentPassword);
    if (!isValid) {
      return NextResponse.json({ ok: false, error: 'Senha atual incorreta' }, { status: 400 });
    }

    const newHash = await hashPassword(newPassword);

    await supabaseAdmin
      .from('platform_admins')
      .update({ password_hash: newHash })
      .eq('id', session.adminId);

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';
    await logActivity({
      adminId: session.adminId,
      action: 'password_changed',
      entity: 'auth',
      entityId: session.adminId,
      metadata: {},
      ip,
      ua,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
