import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*, organizations(name, slug)')
      .order('last_seen_at', { ascending: false });

    if (error) {
      console.error('Get integrations error:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const integrations = (data ?? []).map((row: any) => ({
      id: row.id,
      orgId: row.org_id,
      orgName: row.organizations?.name ?? 'Desconhecido',
      orgSlug: row.organizations?.slug ?? '',
      status: row.status,
      lastSeenAt: row.last_seen_at,
      instanceName: row.instance_name ?? row.name,
      phoneNumber: row.phone_number,
      connectionState: row.connection_state,
    }));

    const connected = integrations.filter((i: any) => i.status === 'connected').length;
    const degraded = integrations.filter((i: any) => i.status === 'degraded').length;
    const disconnected = integrations.filter((i: any) => i.status === 'disconnected').length;

    return NextResponse.json({
      ok: true,
      data: {
        integrations,
        summary: {
          total: integrations.length,
          connected,
          degraded,
          disconnected,
        },
      },
    });
  } catch (error) {
    console.error('Get integrations error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
