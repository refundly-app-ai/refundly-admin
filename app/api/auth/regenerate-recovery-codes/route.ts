import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateRecoveryCodes } from '@/lib/auth/password';
import { logActivity } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.adminId || !session.totpVerified) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';

    const codes = generateRecoveryCodes(10);

    const { error } = await supabaseAdmin
      .from('platform_admins')
      .update({ totp_recovery_codes: codes })
      .eq('id', session.adminId);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await logActivity({
      adminId: session.adminId,
      action: 'recovery_codes_regenerated',
      entity: 'admin',
      entityId: session.adminId,
      metadata: {},
      ip,
      ua,
    });

    return NextResponse.json({ ok: true, data: { codes } });
  } catch (error) {
    console.error('Regenerate recovery codes error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
