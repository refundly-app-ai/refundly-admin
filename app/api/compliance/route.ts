import { NextResponse } from 'next/server';
import { mockOrganizations } from '@/lib/mock-data';

// TODO: replace with real data source
export async function GET() {
  try {
    // Generate mock compliance data
    const duplicates = [
      {
        id: 'dup_1',
        type: 'email_duplicate',
        severity: 'warning' as const,
        orgId: mockOrganizations[0]?.id,
        orgName: mockOrganizations[0]?.name,
        description: 'E-mail duplicado encontrado em múltiplas contas',
        details: { email: 'user@example.com', accounts: 2 },
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'dup_2',
        type: 'phone_duplicate',
        severity: 'info' as const,
        orgId: mockOrganizations[1]?.id,
        orgName: mockOrganizations[1]?.name,
        description: 'Telefone duplicado encontrado',
        details: { phone: '+55 11 99999-9999', accounts: 2 },
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
    ];

    const violations = [
      {
        id: 'viol_1',
        type: 'gdpr_retention',
        severity: 'critical' as const,
        orgId: mockOrganizations[2]?.id,
        orgName: mockOrganizations[2]?.name,
        description: 'Dados pessoais retidos além do período permitido',
        details: { dataType: 'user_logs', retentionDays: 90, actualDays: 120 },
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      },
      {
        id: 'viol_2',
        type: 'password_policy',
        severity: 'warning' as const,
        orgId: mockOrganizations[3]?.id,
        orgName: mockOrganizations[3]?.name,
        description: 'Política de senha não atende requisitos mínimos',
        details: { currentMinLength: 6, requiredMinLength: 8 },
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ];

    const riskQueue = [
      {
        id: 'risk_1',
        type: 'high_churn_risk',
        severity: 'critical' as const,
        orgId: mockOrganizations[4]?.id,
        orgName: mockOrganizations[4]?.name,
        description: 'Organização com alto risco de churn',
        details: { healthScore: 25, lastActivity: '30 dias atrás' },
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'risk_2',
        type: 'usage_anomaly',
        severity: 'warning' as const,
        orgId: mockOrganizations[5]?.id,
        orgName: mockOrganizations[5]?.name,
        description: 'Padrão de uso anormal detectado',
        details: { usageSpike: '500%', period: 'last 24h' },
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ];

    return NextResponse.json({
      ok: true,
      data: {
        duplicates,
        violations,
        riskQueue,
        summary: {
          totalIssues: duplicates.length + violations.length + riskQueue.length,
          critical: violations.filter(v => v.severity === 'critical').length + riskQueue.filter(r => r.severity === 'critical').length,
          warnings: duplicates.filter(d => d.severity === 'warning').length + violations.filter(v => v.severity === 'warning').length + riskQueue.filter(r => r.severity === 'warning').length,
          info: duplicates.filter(d => d.severity === 'info').length,
        },
      },
    });
  } catch (error) {
    console.error('Get compliance error:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro interno do servidor', status: 500 },
      { status: 500 }
    );
  }
}
