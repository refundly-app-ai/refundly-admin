import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { findAdminById } from '@/lib/mocks/admins';

export async function GET() {
  try {
    const session = await getSession();

    if (!session.adminId || !session.totpVerified) {
      return NextResponse.json(
        { ok: false, error: 'Não autenticado', status: 401 },
        { status: 401 }
      );
    }

    const admin = findAdminById(session.adminId);
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: 'Admin não encontrado', status: 404 },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        totpEnabled: admin.totpEnabled,
        lastLoginAt: admin.lastLoginAt,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro interno do servidor', status: 500 },
      { status: 500 }
    );
  }
}
