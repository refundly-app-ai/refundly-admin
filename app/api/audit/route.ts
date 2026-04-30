import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
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
      // Tenant audit logs (cross-org user actions)
      let query = supabaseAdmin
        .from('audit_logs')
        .select('*, organizations(name, slug), profiles(full_name, email)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (org) query = query.eq('org_id', org);
      if (actor) query = query.eq('actor_id', actor);
      if (action) query = query.ilike('action', `%${action}%`);
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);

      const { data, error, count } = await query;

      if (error) {
        console.error('Get tenant audit error:', error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        data: {
          items: data ?? [],
          pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
        },
      });
    }

    // Platform audit logs (super-admin actions) — default
    let query = supabaseAdmin
      .from('platform_audit_logs')
      .select('*, platform_admins(email, full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (actor) query = query.eq('admin_id', actor);
    if (org) query = query.eq('org_id', org);
    if (action) query = query.ilike('action', `%${action}%`);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, error, count } = await query;

    if (error) {
      console.error('Get audit error:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      data: {
        items: data ?? [],
        pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
      },
    });
  } catch (error) {
    console.error('Get audit error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
