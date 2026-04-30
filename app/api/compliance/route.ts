import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const [violationsResult, fingerprintsResult, orgsResult] = await Promise.all([
      supabaseAdmin
        .from('expense_violations')
        .select('*, organizations(name, slug)')
        .order('created_at', { ascending: false })
        .limit(50),
      supabaseAdmin
        .from('receipt_fingerprints')
        .select('*, organizations(name, slug)')
        .order('created_at', { ascending: false })
        .limit(50),
      supabaseAdmin
        .from('organizations')
        .select('id, name, slug, status, health_score')
        .eq('status', 'active')
        .lt('health_score', 40)
        .limit(20),
    ]);

    const violations = (violationsResult.data ?? []).map((v: any) => ({
      id: v.id,
      type: v.violation_type ?? v.type,
      severity: v.severity ?? 'warning',
      orgId: v.org_id,
      orgName: v.organizations?.name,
      description: v.description,
      details: v.details ?? {},
      createdAt: v.created_at,
    }));

    const duplicates = (fingerprintsResult.data ?? []).map((f: any) => ({
      id: f.id,
      type: 'receipt_duplicate',
      severity: 'warning' as const,
      orgId: f.org_id,
      orgName: f.organizations?.name,
      description: 'Recibo duplicado detectado',
      details: { fingerprint: f.fingerprint, occurrences: f.occurrences ?? 2 },
      createdAt: f.created_at,
    }));

    const riskQueue = (orgsResult.data ?? []).map((o: any) => ({
      id: `risk_${o.id}`,
      type: 'high_churn_risk',
      severity: 'critical' as const,
      orgId: o.id,
      orgName: o.name,
      description: 'Organização com alto risco de churn (health score baixo)',
      details: { healthScore: o.health_score },
      createdAt: new Date().toISOString(),
    }));

    const allIssues = [...violations, ...duplicates, ...riskQueue];

    return NextResponse.json({
      ok: true,
      data: {
        duplicates,
        violations,
        riskQueue,
        summary: {
          totalIssues: allIssues.length,
          critical: allIssues.filter(i => i.severity === 'critical').length,
          warnings: allIssues.filter(i => i.severity === 'warning').length,
          info: allIssues.filter(i => i.severity === 'info').length,
        },
      },
    });
  } catch (error) {
    console.error('Get compliance error:', error);
    // Return empty data gracefully if tables don't exist yet
    return NextResponse.json({
      ok: true,
      data: {
        duplicates: [],
        violations: [],
        riskQueue: [],
        summary: { totalIssues: 0, critical: 0, warnings: 0, info: 0 },
      },
    });
  }
}
