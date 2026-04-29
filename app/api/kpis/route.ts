import { NextResponse } from 'next/server';
import { mockOrganizations, mockMembers, mockActivities } from '@/lib/mock-data';

// TODO: replace with real data source
export async function GET() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate KPIs from mock data
    const totalOrgs = mockOrganizations.length;
    const activeOrgs = mockOrganizations.filter(o => o.status === 'active').length;
    const suspendedOrBlocked = mockOrganizations.filter(o => o.status === 'suspended' || o.status === 'blocked').length;
    const totalMembers = mockMembers.length;
    const mau30d = mockMembers.filter(m => m.lastSignInAt && new Date(m.lastSignInAt) > thirtyDaysAgo).length;
    const activity30d = mockActivities.filter(a => new Date(a.createdAt) > thirtyDaysAgo).length;
    const estimatedMRR = mockOrganizations.reduce((sum, o) => sum + o.mrr, 0);
    const newOrgs30d = mockOrganizations.filter(o => new Date(o.createdAt) > thirtyDaysAgo).length;
    const churnedOrgs30d = mockOrganizations.filter(o => o.status === 'churned').length;

    return NextResponse.json({
      ok: true,
      data: {
        totalOrgs,
        activeOrgs,
        suspendedOrBlocked,
        totalMembers,
        mau30d,
        activity30d,
        estimatedMRR,
        newOrgs30d,
        churnedOrgs30d,
        integrationsConnected: 42,
        integrationsDisconnected: 3,
      },
    });
  } catch (error) {
    console.error('Get KPIs error:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro interno do servidor', status: 500 },
      { status: 500 }
    );
  }
}
