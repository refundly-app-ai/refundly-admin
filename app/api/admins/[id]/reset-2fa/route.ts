import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/audit';

export async function POST(
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
        { ok: false, error: 'Use a página do seu perfil para resetar seu próprio 2FA' },
        { status: 400 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';

    const { error } = await supabaseAdmin
      .from('platform_admins')
      .update({
        totp_enabled: false,
        totp_secret: null,
        totp_recovery_codes: null,
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await logActivity({
      adminId: session.adminId,
      action: 'admin_2fa_reset',
      entity: 'platform_admin',
      entityId: id,
      metadata: {},
      ip,
      ua,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Reset 2FA error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
