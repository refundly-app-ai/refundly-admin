import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.adminId || !session.totpVerified) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin.rpc('superadmin_compliance');

    if (error) {
      console.error('Get compliance error:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const violations = (data?.violations ?? []).map((v: any) => ({
      id: v.id,
      type: 'policy_violation',
      severity: v.resolved_at ? 'info' : 'warning',
      orgId: v.org_id,
      orgName: v.org_name,
      description: `Violação detectada: ${v.matched_field} — "${v.matched_term}"`,
      details: { matchedTerm: v.matched_term, matchedField: v.matched_field, resolution: v.resolution },
      createdAt: v.created_at,
    }));

    const duplicates = (data?.duplicates ?? []).map((f: any) => ({
      id: f.id,
      type: 'receipt_duplicate',
      severity: 'warning' as const,
      orgId: f.org_id,
      orgName: f.org_name,
      description: 'Recibo duplicado detectado',
      details: { fingerprint: f.fingerprint, expenseId: f.expense_id },
      createdAt: f.created_at,
    }));

    const divergentReceipts = (data?.divergent_receipts ?? []).map((f: any) => {
      let discrepancies: string[] = [];
      try {
        discrepancies = typeof f.discrepancies === 'string'
          ? JSON.parse(f.discrepancies)
          : (f.discrepancies ?? []);
      } catch { discrepancies = []; }

      const description = discrepancies.length > 0
        ? discrepancies[0]
        : `Comprovante divergente no campo: ${f.field ?? 'desconhecido'}`;

      return {
        id: f.id,
        type: 'divergent_receipt',
        severity: 'warning' as const,
        orgId: f.org_id,
        orgName: f.org_name,
        description,
        details: {
          expenseId: f.expense_id,
          field: f.field,
          discrepancies,
          ocrAmount: f.ocr_amount,
          ocrDate: f.ocr_date,
          ocrVendor: f.ocr_vendor,
          expenseAmount: f.expense_amount,
          expenseDate: f.expense_date,
          vendorName: f.vendor_name,
        },
        createdAt: f.created_at,
      };
    });

    const riskQueue = (data?.risk_orgs ?? []).map((o: any) => ({
      id: `risk_${o.id}`,
      type: 'high_churn_risk',
      severity: 'critical' as const,
      orgId: o.id,
      orgName: o.name,
      description: 'Organização com alto risco de churn (health score baixo)',
      details: { healthScore: o.health_score, billingStatus: o.billing_status },
      createdAt: new Date().toISOString(),
    }));

    const allIssues = [...violations, ...duplicates, ...divergentReceipts, ...riskQueue];

    return NextResponse.json({
      ok: true,
      data: {
        duplicates,
        divergentReceipts,
        violations,
        riskQueue,
        summary: {
          totalIssues: allIssues.length,
          critical: allIssues.filter((i) => i.severity === 'critical').length,
          warnings: allIssues.filter((i) => i.severity === 'warning').length,
          info: allIssues.filter((i) => i.severity === 'info').length,
        },
      },
    });
  } catch (error) {
    console.error('Get compliance error:', error);
    return NextResponse.json({
      ok: true,
      data: {
        duplicates: [],
        divergentReceipts: [],
        violations: [],
        riskQueue: [],
        summary: { totalIssues: 0, critical: 0, warnings: 0, info: 0 },
      },
    });
  }
}
