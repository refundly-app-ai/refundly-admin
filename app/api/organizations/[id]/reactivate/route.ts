import { NextRequest, NextResponse } from 'next/server';
import { mockOrganizations } from '@/lib/mock-data';
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

    const org = mockOrganizations.find(o => o.id === id);
    if (!org) {
      return NextResponse.json(
        { ok: false, error: 'Organização não encontrada', status: 404 },
        { status: 404 }
      );
    }

    const previousStatus = org.status;
    org.status = 'active';

    await logActivity({
      adminId: session.adminId || null,
      action: 'org_reactivated',
      entity: 'organization',
      entityId: id,
      orgId: id,
      metadata: { previousStatus },
      ip,
      ua,
    });

    return NextResponse.json({
      ok: true,
      data: { reactivated: true },
    });
  } catch (error) {
    console.error('Reactivate organization error:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro interno do servidor', status: 500 },
      { status: 500 }
    );
  }
}
