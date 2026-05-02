import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.adminId || !session.totpVerified) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin.rpc('superadmin_integrations');

    if (error) {
      console.error('Get integrations error:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const integrations = (data?.integrations ?? []).map((row: any) => ({
      id: row.id,
      orgId: row.org_id,
      orgName: row.org_name ?? 'Desconhecido',
      orgSlug: row.org_slug ?? '',
      instanceId: row.instance_id,
      name: row.name,
      phoneNumber: row.phone_number,
      status: row.status,
      isActive: row.is_active,
      connectedAt: row.connected_at,
      provider: row.provider,
    }));

    const connected = integrations.filter((i: any) => i.status === 'connected').length;
    const degraded = integrations.filter((i: any) => i.status === 'degraded').length;
    const disconnected = integrations.filter((i: any) => i.status === 'disconnected').length;

    return NextResponse.json({
      ok: true,
      data: {
        integrations,
        summary: { total: integrations.length, connected, degraded, disconnected },
      },
    });
  } catch (error) {
    console.error('Get integrations error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
