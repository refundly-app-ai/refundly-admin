import { NextRequest, NextResponse } from 'next/server';
import { getSession, destroySession } from '@/lib/auth/session';
import { logActivity } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';
    const session = await getSession();

    if (session.adminId) {
      await logActivity({
        adminId: session.adminId,
        action: 'logout',
        entity: 'auth',
        entityId: session.adminId,
        ip,
        ua,
      });
    }

    await destroySession();

    return NextResponse.json({
      ok: true,
      data: { loggedOut: true },
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro interno do servidor', status: 500 },
      { status: 500 }
    );
  }
}
