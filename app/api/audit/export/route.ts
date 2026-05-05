import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCsv(values: unknown[]): string {
  return values.map(escapeCsv).join(',');
}

const EXPORT_LIMIT = 5000;

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.adminId || !session.totpVerified) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') ?? 'tenant';
    const org = searchParams.get('org');
    const actor = searchParams.get('actor');
    const action = searchParams.get('action');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let rows: Array<Record<string, unknown>> = [];

    if (type === 'tenant') {
      let query = supabaseAdmin
        .from('audit_logs')
        .select('*, organizations(name), profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(EXPORT_LIMIT);

      if (org) query = query.eq('org_id', org);
      if (actor) query = query.eq('actor_id', actor);
      if (action) query = query.ilike('action', `%${action}%`);
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);

      const { data } = await query;

      rows = (data ?? []).map((l) => ({
        id: l.id,
        timestamp: l.created_at,
        action: l.action,
        actor_name: (l.profiles as { full_name?: string; email?: string } | null)?.full_name ?? (l.profiles as { email?: string } | null)?.email ?? '',
        actor_id: l.actor_id,
        organization: (l.organizations as { name?: string } | null)?.name ?? '',
        ip: l.ip ?? '',
        metadata: JSON.stringify(l.metadata ?? {}),
      }));
    } else {
      let query = supabaseAdmin
        .from('platform_audit_logs')
        .select('*, platform_admins(email, full_name)')
        .order('created_at', { ascending: false })
        .limit(EXPORT_LIMIT);

      if (actor) query = query.eq('admin_id', actor);
      if (org) query = query.eq('org_id', org);
      if (action) query = query.ilike('action', `%${action}%`);
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);

      const { data } = await query;

      rows = (data ?? []).map((l) => ({
        id: l.id,
        timestamp: l.created_at,
        action: l.action,
        actor_name: (l.platform_admins as { full_name?: string; email?: string } | null)?.full_name ?? (l.platform_admins as { email?: string } | null)?.email ?? '',
        actor_id: l.admin_id,
        organization: '',
        ip: l.ip ?? '',
        metadata: JSON.stringify(l.metadata ?? {}),
      }));
    }

    const headers = ['id', 'timestamp', 'action', 'actor_name', 'actor_id', 'organization', 'ip', 'metadata'];
    const csvLines = [
      headers.join(','),
      ...rows.map((row) => rowToCsv(headers.map((h) => row[h]))),
    ];

    const csv = csvLines.join('\n');
    const filename = `audit-logs-${type}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export audit error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
