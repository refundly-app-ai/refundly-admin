import { NextResponse } from 'next/server';
import { mockOrganizations } from '@/lib/mock-data';

// TODO: replace with real data source
export async function GET() {
  try {
    // Mock scheduled jobs
    const scheduledJobs = [
      {
        id: 'job_1',
        name: 'Sync Billing Data',
        schedule: '0 * * * *',
        lastRun: new Date(Date.now() - 3600000).toISOString(),
        lastStatus: 'success' as const,
        errorCount7d: 0,
      },
      {
        id: 'job_2',
        name: 'Send Usage Reports',
        schedule: '0 9 * * 1',
        lastRun: new Date(Date.now() - 86400000 * 2).toISOString(),
        lastStatus: 'success' as const,
        errorCount7d: 1,
      },
      {
        id: 'job_3',
        name: 'Cleanup Expired Sessions',
        schedule: '0 3 * * *',
        lastRun: new Date(Date.now() - 86400000).toISOString(),
        lastStatus: 'failed' as const,
        errorCount7d: 3,
      },
      {
        id: 'job_4',
        name: 'Generate Analytics',
        schedule: '0 0 * * *',
        lastRun: new Date(Date.now() - 43200000).toISOString(),
        lastStatus: 'success' as const,
        errorCount7d: 0,
      },
    ];

    // Mock webhook delivery stats
    const webhookHealth = {
      successRate: 98.5,
      totalDeliveries24h: 15420,
      failedDeliveries24h: 232,
      retryDepthHistogram: [
        { depth: 0, count: 15188 },
        { depth: 1, count: 180 },
        { depth: 2, count: 42 },
        { depth: 3, count: 10 },
      ],
    };

    // Lifecycle funnel
    const totalOrgs = mockOrganizations.length;
    const withMembers = mockOrganizations.filter(o => o.membersCount > 0).length;
    const withActivity = mockOrganizations.filter(o => o.firstActivityAt).length;
    const active30d = mockOrganizations.filter(o => o.activeMembers30d > 0).length;
    const churning = mockOrganizations.filter(o => o.status === 'churned').length;

    const lifecycleFunnel = [
      { stage: 'Organizações Criadas', count: totalOrgs, percentage: 100 },
      { stage: 'Com Membros', count: withMembers, percentage: Math.round((withMembers / totalOrgs) * 100) },
      { stage: 'Primeira Atividade', count: withActivity, percentage: Math.round((withActivity / totalOrgs) * 100) },
      { stage: 'Ativos 30d', count: active30d, percentage: Math.round((active30d / totalOrgs) * 100) },
      { stage: 'Em Churn', count: churning, percentage: Math.round((churning / totalOrgs) * 100) },
    ];

    return NextResponse.json({
      ok: true,
      data: {
        scheduledJobs,
        webhookHealth,
        lifecycleFunnel,
      },
    });
  } catch (error) {
    console.error('Get operations error:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro interno do servidor', status: 500 },
      { status: 500 }
    );
  }
}
