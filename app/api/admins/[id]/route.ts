import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/audit';

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  fullName: z.string().min(2).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session.adminId || !session.totpVerified) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }

    if (id === session.adminId) {
      return NextResponse.json(
        { ok: false, error: 'Você não pode alterar seu próprio acesso por aqui' },
        { status: 400 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';

    const body = await request.json();
    const validation = patchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = {};
    if (typeof validation.data.isActive === 'boolean') update.is_active = validation.data.isActive;
    if (validation.data.fullName) update.full_name = validation.data.fullName;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ ok: false, error: 'Nada para atualizar' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('platform_admins')
      .update(update)
      .eq('id', id)
      .select('id, email, full_name, is_active, totp_enabled, last_login_at, created_at')
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await logActivity({
      adminId: session.adminId,
      action: typeof validation.data.isActive === 'boolean'
        ? (validation.data.isActive ? 'admin_reactivated' : 'admin_revoked')
        : 'admin_updated',
      entity: 'platform_admin',
      entityId: id,
      metadata: update,
      ip,
      ua,
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        isActive: data.is_active,
        totpEnabled: data.totp_enabled,
        lastLoginAt: data.last_login_at,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error('Patch admin error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session.adminId || !session.totpVerified) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }

    if (id === session.adminId) {
      return NextResponse.json(
        { ok: false, error: 'Você não pode remover sua própria conta' },
        { status: 400 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';

    const { error } = await supabaseAdmin
      .from('platform_admins')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await logActivity({
      adminId: session.adminId,
      action: 'admin_deleted',
      entity: 'platform_admin',
      entityId: id,
      metadata: {},
      ip,
      ua,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete admin error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
