import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.adminId || !session.totpVerified) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50') || 50));
    const type = searchParams.get('type'); // 'platform' or 'tenant'
    const actor = searchParams.get('actor');
    const org = searchParams.get('org');
    const action = searchParams.get('action');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const offset = (page - 1) * limit;

    if (type === 'tenant') {
      const search = searchParams.get('search') || '';
      const actionParam = searchParams.get('action') || '';

      const { data, error } = await supabaseAdmin.rpc('superadmin_tenant_audit_logs', {
        p_limit: 500,
        p_offset: 0,
      });

      if (error) {
        console.error('Get tenant audit error:', error);
        return NextResponse.json({ ok: false, error: 'Erro ao buscar logs de auditoria' }, { status: 500 });
      }

      type TenantAuditRow = {
        id: string;
        org_id: string;
        org_name: string | null;
        actor_user_id: string | null;
        actor_name: string | null;
        actor_email: string | null;
        action: string;
        entity: string | null;
        entity_id: string | null;
        metadata: Record<string, unknown> | null;
        ip_address: string | null;
        created_at: string;
      };
      let mapped = ((data ?? []) as TenantAuditRow[]).map((l) => ({
        id: l.id,
        orgId: l.org_id,
        orgName: l.org_name,
        actorId: l.actor_user_id,
        actorName: l.actor_name || l.actor_email || 'Usuário',
        action: l.action,
        entity: l.entity,
        entityId: l.entity_id,
        metadata: l.metadata ?? {},
        ip: l.ip_address,
        createdAt: l.created_at,
      }));

      if (search) {
        const s = search.toLowerCase();
        mapped = mapped.filter(
          (l) =>
            l.actorName.toLowerCase().includes(s) ||
            (l.orgName?.toLowerCase().includes(s) ?? false) ||
            l.action.toLowerCase().includes(s)
        );
      }
      if (actionParam) {
        mapped = mapped.filter((l) => l.action.startsWith(actionParam));
      }

      const total = mapped.length;
      const items = mapped.slice(offset, offset + limit);

      const res = NextResponse.json({
        ok: true,
        data: {
          items,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
      });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Platform audit logs (default)
    const { data, error } = await supabaseAdmin.rpc('superadmin_audit_logs', {
      p_limit: limit,
      p_offset: offset,
      p_admin_id: actor ?? null,
      p_org_id: org ?? null,
      p_action: action ?? null,
      p_start_date: startDate ?? null,
      p_end_date: endDate ?? null,
    });

    if (error) {
      console.error('Get audit error:', error);
      return NextResponse.json({ ok: false, error: 'Erro ao buscar logs de auditoria' }, { status: 500 });
    }

    type PlatformAuditRow = {
      id: string;
      admin_id: string | null;
      admin_email: string | null;
      admin_name: string | null;
      action: string;
      entity: string | null;
      entity_id: string | null;
      org_id: string | null;
      org_name: string | null;
      metadata: Record<string, unknown> | null;
      ip: string | null;
      created_at: string;
    };
    const items = ((data?.items ?? []) as PlatformAuditRow[]).map((l) => ({
      id: l.id,
      adminId: l.admin_id,
      adminEmail: l.admin_email,
      adminName: l.admin_name,
      action: l.action,
      entity: l.entity,
      entityId: l.entity_id,
      orgId: l.org_id,
      orgName: l.org_name,
      metadata: l.metadata ?? {},
      ip: l.ip,
      createdAt: l.created_at,
    }));

    const res = NextResponse.json({
      ok: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total: Number(data?.total ?? 0),
          totalPages: Math.ceil(Number(data?.total ?? 0) / limit),
        },
      },
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Get audit error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
