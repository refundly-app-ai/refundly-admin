import { NextResponse } from 'next/server';
import { mockIntegrations, mockOrganizations } from '@/lib/mock-data';

// TODO: replace with real data source
export async function GET() {
  try {
    // Enrich integrations with org names
    const enrichedIntegrations = mockIntegrations.map(integration => {
      const org = mockOrganizations.find(o => o.id === integration.orgId);
      return {
        ...integration,
        orgName: org?.name || 'Organização Desconhecida',
        orgSlug: org?.slug || 'unknown',
      };
    });

    // Summary stats
    const connected = enrichedIntegrations.filter(i => i.status === 'connected').length;
    const degraded = enrichedIntegrations.filter(i => i.status === 'degraded').length;
    const disconnected = enrichedIntegrations.filter(i => i.status === 'disconnected').length;

    return NextResponse.json({
      ok: true,
      data: {
        integrations: enrichedIntegrations,
        summary: {
          total: enrichedIntegrations.length,
          connected,
          degraded,
          disconnected,
        },
      },
    });
  } catch (error) {
    console.error('Get integrations error:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro interno do servidor', status: 500 },
      { status: 500 }
    );
  }
}
