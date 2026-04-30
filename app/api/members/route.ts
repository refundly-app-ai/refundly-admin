import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const banned = searchParams.get('banned');
    const neverLoggedIn = searchParams.get('neverLoggedIn');

    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('user_org_roles')
      .select(`
        user_id,
        role,
        org_id,
        profiles!inner(full_name, email, whatsapp_verified, banned),
        organizations!inner(name, slug)
      `, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('user_id');

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Get members error:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    let items = (data ?? []).map((row: any) => ({
      id: row.user_id,
      email: row.profiles?.email,
      fullName: row.profiles?.full_name,
      role: row.role,
      orgId: row.org_id,
      orgName: row.organizations?.name,
      orgSlug: row.organizations?.slug,
      banned: row.profiles?.banned ?? false,
      whatsappVerified: row.profiles?.whatsapp_verified ?? false,
    }));

    if (search) {
      const s = search.toLowerCase();
      items = items.filter(
        (m: any) =>
          m.email?.toLowerCase().includes(s) ||
          m.fullName?.toLowerCase().includes(s)
      );
    }

    if (banned === 'true') {
      items = items.filter((m: any) => m.banned);
    } else if (banned === 'false') {
      items = items.filter((m: any) => !m.banned);
    }

    if (neverLoggedIn === 'true') {
      // Filter by auth.users last_sign_in_at would need admin API
      // For now we skip this filter as it requires joining auth.users
    }

    return NextResponse.json({
      ok: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total: count ?? items.length,
          totalPages: Math.ceil((count ?? items.length) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get members error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
