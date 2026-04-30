import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';
import { logActivity } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id);

    if (!authUser?.user) {
      return NextResponse.json({ ok: false, error: 'Membro não encontrado' }, { status: 404 });
    }

    // Force the user to reset their password by generating a recovery link
    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: authUser.user.email!,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await logActivity({
      adminId: session.adminId || null,
      action: 'member_password_reset_forced',
      entity: 'member',
      entityId: id,
      metadata: { email: authUser.user.email },
      ip,
      ua,
    });

    return NextResponse.json({
      ok: true,
      data: { resetForced: true, email: authUser.user.email },
    });
  } catch (error) {
    console.error('Force reset error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
