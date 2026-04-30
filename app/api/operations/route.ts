import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const [webhooksResult, lifecycleResult, orgsResult] = await Promise.all([
      supabaseAdmin
        .from('webhook_logs')
        .select('status, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabaseAdmin
        .from('lifecycle_emails_sent')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      supabaseAdmin
        .from('organizations')
        .select('id, status, created_at, first_activity_at, members_count, active_members_30d'),
    ]);

    const webhooks = webhooksResult.data ?? [];
    const totalWebhooks = webhooks.length;
    const failedWebhooks = webhooks.filter((w: any) => w.status === 'failed').length;

    const orgs = orgsResult.data ?? [];
    const totalOrgs = orgs.length;
    const withMembers = orgs.filter((o: any) => (o.members_count ?? 0) > 0).length;
    const withActivity = orgs.filter((o: any) => o.first_activity_at).length;
    const active30d = orgs.filter((o: any) => (o.active_members_30d ?? 0) > 0).length;
    const churning = orgs.filter((o: any) => o.status === 'churned').length;

    return NextResponse.json({
      ok: true,
      data: {
        scheduledJobs: [],
        webhookHealth: {
          successRate: totalWebhooks > 0 ? ((totalWebhooks - failedWebhooks) / totalWebhooks) * 100 : 100,
          totalDeliveries24h: totalWebhooks,
          failedDeliveries24h: failedWebhooks,
          retryDepthHistogram: [],
        },
        lifecycleFunnel: totalOrgs > 0 ? [
          { stage: 'Organizações Criadas', count: totalOrgs, percentage: 100 },
          { stage: 'Com Membros', count: withMembers, percentage: Math.round((withMembers / totalOrgs) * 100) },
          { stage: 'Primeira Atividade', count: withActivity, percentage: Math.round((withActivity / totalOrgs) * 100) },
          { stage: 'Ativos 30d', count: active30d, percentage: Math.round((active30d / totalOrgs) * 100) },
          { stage: 'Em Churn', count: churning, percentage: Math.round((churning / totalOrgs) * 100) },
        ] : [],
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
