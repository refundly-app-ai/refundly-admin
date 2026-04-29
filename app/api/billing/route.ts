import { NextResponse } from 'next/server';
import { mockOrganizations, mockBillingEvents } from '@/lib/mock-data';

// TODO: replace with real data source
export async function GET() {
  try {
    // Calculate billing metrics
    const mrr = mockOrganizations.reduce((sum, o) => sum + o.mrr, 0);
    const arr = mrr * 12;
    const arpu = mrr / mockOrganizations.filter(o => o.status === 'active').length;
    const churnRate = (mockOrganizations.filter(o => o.status === 'churned').length / mockOrganizations.length) * 100;

    // Orgs near limit (usage > 80%)
    const orgsNearLimit = mockOrganizations
      .filter(o => o.monthlyUsage / o.monthlyLimit > 0.8)
      .map(o => ({
        id: o.id,
        name: o.name,
        usage: o.monthlyUsage,
        limit: o.monthlyLimit,
        percentage: Math.round((o.monthlyUsage / o.monthlyLimit) * 100),
      }));

    // Blocked orgs
    const blockedOrgs = mockOrganizations
      .filter(o => o.status === 'blocked')
      .map(o => ({
        id: o.id,
        name: o.name,
        plan: o.plan,
        mrr: o.mrr,
      }));

    // Failed billing events (dunning)
    const failedEvents = mockBillingEvents.filter(e => e.status === 'failed');
    const dunningTotal = failedEvents.reduce((sum, e) => sum + (e.amount || 0), 0);

    return NextResponse.json({
      ok: true,
      data: {
        metrics: {
          mrr,
          arr,
          arpu,
          churnRate,
          dunningTotal,
        },
        recentEvents: mockBillingEvents.slice(0, 20),
        orgsNearLimit,
        blockedOrgs,
      },
    });
  } catch (error) {
    console.error('Get billing error:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro interno do servidor', status: 500 },
      { status: 500 }
    );
  }
}
