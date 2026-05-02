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
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const wh = data?.webhook_health ?? {};
    const funnel = (data?.lifecycle_funnel ?? []).map((item: any, index: number, arr: any[]) => {
      const base = arr[0]?.count ?? 1;
      return {
        stage: item.stage,
        count: Number(item.count ?? 0),
        percentage: base > 0 ? Math.round((Number(item.count ?? 0) / base) * 100) : 0,
      };
    });

    return NextResponse.json({
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
  } catch (error) {
    console.error('Get operations error:', error);
    return NextResponse.json({
      ok: true,
      data: {
        scheduledJobs: [],
        webhookHealth: { successRate: 100, totalDeliveries24h: 0, failedDeliveries24h: 0, retryDepthHistogram: [] },
        lifecycleFunnel: [],
      },
    });
  }
}
