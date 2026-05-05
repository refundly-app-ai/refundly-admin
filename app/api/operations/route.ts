import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.adminId || !session.totpVerified) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin.rpc('superadmin_operations');

    if (error) {
      console.error('Get operations error:', error);
      return NextResponse.json({ ok: false, error: 'Erro ao buscar dados de operações' }, { status: 500 });
    }

    const wh = data?.webhook_health ?? {};
    type FunnelItem = { stage: string; count: number | string };
    const funnelData = (data?.lifecycle_funnel ?? []) as FunnelItem[];
    const funnel = funnelData.map((item, _index, arr) => {
      const base = Number(arr[0]?.count ?? 1);
      return {
        stage: item.stage,
        count: Number(item.count ?? 0),
        percentage: base > 0 ? Math.round((Number(item.count ?? 0) / base) * 100) : 0,
      };
    });

    const response = NextResponse.json({
      ok: true,
      data: {
        scheduledJobs: [],
        webhookHealth: {
          successRate: Number(wh.success_rate ?? 100),
          totalDeliveries24h: Number(wh.total_24h ?? 0),
          failedDeliveries24h: Number(wh.failed_24h ?? 0),
          retryDepthHistogram: [],
        },
        lifecycleFunnel: funnel,
      },
    });
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=30');
    return response;
  } catch (error) {
    console.error('Get operations error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
