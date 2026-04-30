import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.rpc('superadmin_global_kpis');

    if (error) {
      console.error('KPIs RPC error:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: data?.[0] ?? data });
  } catch (error) {
    console.error('Get KPIs error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
