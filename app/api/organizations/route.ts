import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
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
    if (status) {
      query = query.eq('status', status);
    }
    if (plan) {
      query = query.eq('plan', plan);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Get organizations error:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      data: {
        items: data ?? [],
        pagination: {
          page,
          limit,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get organizations error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
