import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { findAdminById } from '@/lib/db/admins';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/audit';

const patchSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
});

export async function GET() {
  try {
    const session = await getSession();

    if (!session.adminId || !session.totpVerified) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }

    const admin = await findAdminById(session.adminId);
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Admin não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: admin.id,
        email: admin.email,
        fullName: admin.full_name,
        totpEnabled: admin.totp_enabled,
        lastLoginAt: admin.last_login_at,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.adminId || !session.totpVerified) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const validation = patchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.errors[0].message },
        { status: 400 },
      );
    }

    const fullName = validation.data.fullName.trim();
    if (fullName.length < 2) {
      return NextResponse.json(
        { ok: false, error: 'Nome deve ter pelo menos 2 caracteres' },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('platform_admins')
      .update({ full_name: fullName })
      .eq('id', session.adminId)
      .select('id, email, full_name, totp_enabled, last_login_at')
      .single();

    if (error) {
      console.error('Update profile error:', error);
      return NextResponse.json({ ok: false, error: 'Erro ao atualizar perfil' }, { status: 500 });
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';
    await logActivity({
      adminId: session.adminId,
      action: 'profile_updated',
      entity: 'platform_admin',
      entityId: session.adminId,
      metadata: { fullName },
      ip,
      ua,
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        totpEnabled: data.totp_enabled,
        lastLoginAt: data.last_login_at,
      },
    });
  } catch (error) {
    console.error('Patch me error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
