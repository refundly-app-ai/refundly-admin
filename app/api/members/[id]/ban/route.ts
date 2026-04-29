import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mockMembers } from '@/lib/mock-data';
import { getSession } from '@/lib/auth/session';
import { logActivity } from '@/lib/audit';

const banSchema = z.object({
  reason: z.string().min(1, 'Motivo é obrigatório'),
});

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

    const body = await request.json();
    const validation = banSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.errors[0].message, status: 400 },
        { status: 400 }
      );
    }

    const member = mockMembers.find(m => m.id === id);
    if (!member) {
      return NextResponse.json(
        { ok: false, error: 'Membro não encontrado', status: 404 },
        { status: 404 }
      );
    }

    member.banned = true;

    await logActivity({
      adminId: session.adminId || null,
      action: 'member_banned',
      entity: 'member',
      entityId: id,
      metadata: { reason: validation.data.reason, email: member.email },
      ip,
      ua,
    });

    return NextResponse.json({
      ok: true,
      data: { banned: true },
    });
  } catch (error) {
    console.error('Ban member error:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro interno do servidor', status: 500 },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    member.banned = false;

    await logActivity({
      adminId: session.adminId || null,
      action: 'member_unbanned',
      entity: 'member',
      entityId: id,
      metadata: { email: member.email },
      ip,
      ua,
    });

    return NextResponse.json({
      ok: true,
      data: { unbanned: true },
    });
  } catch (error) {
    console.error('Unban member error:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro interno do servidor', status: 500 },
      { status: 500 }
    );
  }
}
