import { NextRequest, NextResponse } from 'next/server';
import { mockOrganizations, mockMembers, mockActivities, mockBillingEvents, mockIntegrations } from '@/lib/mock-data';

// TODO: replace with real data source
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const org = mockOrganizations.find(o => o.id === id);

    if (!org) {
      return NextResponse.json(
        { ok: false, error: 'Organização não encontrada', status: 404 },
        { status: 404 }
      );
    }

    // Get related data
    const members = mockMembers.filter(m => m.orgs.some(o => o.orgId === id));
    const activities = mockActivities.filter(a => a.orgId === id);
    const billingEvents = mockBillingEvents.filter(b => b.orgId === id);
    const integrations = mockIntegrations.filter(i => i.orgId === id);

    return NextResponse.json({
      ok: true,
      data: {
        organization: org,
        members,
        activities: activities.slice(0, 50),
        billingEvents: billingEvents.slice(0, 20),
        integrations,
      },
    });
  } catch (error) {
    console.error('Get organization error:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro interno do servidor', status: 500 },
      { status: 500 }
    );
  }
}
