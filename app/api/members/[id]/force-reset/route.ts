import { NextRequest, NextResponse } from 'next/server';
import { mockMembers } from '@/lib/mock-data';
import { getSession } from '@/lib/auth/session';
import { logActivity } from '@/lib/audit';

// TODO: replace with real data source
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';

    const member = mockMembers.find(m => m.id === id);
    if (!member) {
      return NextResponse.json(
        { ok: false, error: 'Membro não encontrado', status: 404 },
        { status: 404 }
      );
    }

    await logActivity({
      adminId: session.adminId || null,
      action: 'member_password_reset_forced',
      entity: 'member',
      entityId: id,
      metadata: { email: member.email },
      ip,
      ua,
    });

    return NextResponse.json({
      ok: true,
      data: { resetForced: true, email: member.email },
    });
  } catch (error) {
    console.error('Force reset error:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro interno do servidor', status: 500 },
      { status: 500 }
    );
  }
}
