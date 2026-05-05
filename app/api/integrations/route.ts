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

    type IntegrationRow = { id: string; org_id: string; org_name: string | null; org_slug: string | null; instance_id: string; name: string; phone_number: string | null; status: string; is_active: boolean; connected_at: string | null; provider: string | null };
    const integrations = ((data?.integrations ?? []) as IntegrationRow[]).map((row) => ({
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

    const connected = integrations.filter((i) => i.status === 'connected').length;
    const degraded = integrations.filter((i) => i.status === 'degraded').length;
    const disconnected = integrations.filter((i) => i.status !== 'connected' && i.status !== 'degraded').length;

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
