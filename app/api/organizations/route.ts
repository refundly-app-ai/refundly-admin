import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';
import { logActivity } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.adminId || !session.totpVerified) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const plan = searchParams.get('plan');

    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('organizations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'suspended' || status === 'blocked') {
      query = query.eq('is_active', false);
    } else if (status === 'trial') {
      query = query.eq('billing_status', 'trial');
    }
    if (plan) {
      query = query.eq('billing_status', plan);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Get organizations error:', error);
      return NextResponse.json({ ok: false, error: 'Erro ao buscar organizações' }, { status: 500 });
    }

    const orgIds = (data ?? []).map((org) => org.id);
    const { data: statsData } = await supabaseAdmin.rpc('superadmin_org_stats', {
      p_org_ids: orgIds,
    });

    const statsMap = new Map<string, { member_count: number; mrr: number }>();
    for (const s of statsData ?? []) {
      statsMap.set(s.org_id, { member_count: Number(s.member_count), mrr: Number(s.mrr) });
    }

    const items = (data ?? []).map((org) => ({
      ...org,
      member_count: statsMap.get(org.id)?.member_count ?? 0,
      mrr: statsMap.get(org.id)?.mrr ?? 0,
    }));

    const res = NextResponse.json({
      ok: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / limit),
        },
      },
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Get organizations error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

const createOrgSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  slug: z.string().min(2, 'Slug deve ter pelo menos 2 caracteres').regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  plan: z.enum(['free', 'essential', 'enterprise']).default('free'),
  domain: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';

    const body = await request.json();
    const validation = createOrgSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, slug, plan, domain } = validation.data;

    const { data: existing } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: false, error: 'Já existe uma organização com este slug' }, { status: 409 });
    }

    const { data: org, error } = await supabaseAdmin
      .from('organizations')
      .insert({ name, slug, plan, domain: domain || null, status: 'active' })
      .select()
      .single();

    if (error) {
      console.error('Create org error:', error);
      return NextResponse.json({ ok: false, error: 'Erro ao criar organização' }, { status: 500 });
    }

    await logActivity({
      adminId: session.adminId || null,
      action: 'org.created',
      entity: 'organization',
      entityId: org.id,
      orgId: org.id,
      metadata: { name, slug, plan },
      ip,
      ua,
    });

    return NextResponse.json({ ok: true, data: org }, { status: 201 });
  } catch (error) {
    console.error('Create organization error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
