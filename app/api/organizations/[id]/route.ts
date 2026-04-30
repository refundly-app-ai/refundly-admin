import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: healthData, error } = await supabaseAdmin.rpc('superadmin_org_health', { p_org_id: id });

    if (error) {
      console.error('Org health RPC error:', error);
      // Fallback: query organization directly
      const { data: org, error: orgError } = await supabaseAdmin
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (orgError || !org) {
        return NextResponse.json({ ok: false, error: 'Organização não encontrada' }, { status: 404 });
      }

      return NextResponse.json({ ok: true, data: { organization: org, members: [], activities: [], billingEvents: [], integrations: [] } });
    }

    const result = Array.isArray(healthData) ? healthData[0] : healthData;

    if (!result) {
      return NextResponse.json({ ok: false, error: 'Organização não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    console.error('Get organization error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
