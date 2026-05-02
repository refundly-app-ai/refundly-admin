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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type'); // 'platform' or 'tenant'
    const actor = searchParams.get('actor');
    const org = searchParams.get('org');
    const action = searchParams.get('action');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const offset = (page - 1) * limit;

    if (type === 'tenant') {
      const { data, error, count } = await supabaseAdmin
        .from('audit_logs')
        .select('id, org_id, actor_user_id, action, entity, entity_id, metadata, ip_address, user_agent, created_at, organizations(name, slug), profiles!audit_logs_actor_user_id_fkey(full_name, email)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Get tenant audit error:', error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }

      const items = (data ?? []).map((l: any) => ({
        id: l.id,
        orgId: l.org_id,
        orgName: l.organizations?.name,
        actorId: l.actor_user_id,
        actorName: l.profiles?.full_name || l.profiles?.email || 'Usuário',
        action: l.action,
        entity: l.entity,
        entityId: l.entity_id,
        metadata: l.metadata ?? {},
        ip: l.ip_address,
        createdAt: l.created_at,
      }));

      return NextResponse.json({
        ok: true,
        data: {
          items,
          pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
        },
      });
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
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const items = (data?.items ?? []).map((l: any) => ({
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

    return NextResponse.json({
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
  } catch (error) {
    console.error('Get audit error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
