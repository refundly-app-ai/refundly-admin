import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';
import { logActivity } from '@/lib/audit';

const impersonateSchema = z.object({
  reason: z.string().min(3, 'Motivo deve ter pelo menos 3 caracteres'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';

    if (!session.adminId || !session.totpVerified) {
      return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validation = impersonateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id);

    if (!authUser?.user) {
      return NextResponse.json({ ok: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: authUser.user.email!,
    });

    if (linkError || !linkData) {
      console.error('Generate link error:', linkError);
      return NextResponse.json({ ok: false, error: 'Erro ao gerar link de acesso' }, { status: 500 });
    }

    await logActivity({
      adminId: session.adminId,
      action: 'impersonation.started',
      entity: 'member',
      entityId: id,
      metadata: {
        reason: validation.data.reason,
        targetEmail: authUser.user.email,
      },
      ip,
      ua,
    });

    return NextResponse.json({
      ok: true,
      data: {
        link: linkData.properties.action_link,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error('Impersonate error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
