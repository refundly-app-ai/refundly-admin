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
      return NextResponse.json({ ok: false, error: 'Erro ao buscar dados de conformidade' }, { status: 500 });
    }

    type ViolationRow = { id: string; org_id: string; org_name: string; matched_field: string; matched_term: string; resolution: string | null; resolved_at: string | null; created_at: string };
    const violations = ((data?.violations ?? []) as ViolationRow[]).map((v) => ({
      id: v.id,
      type: 'policy_violation',
      severity: v.resolved_at ? 'info' : 'warning',
      orgId: v.org_id,
      orgName: v.org_name,
      description: `Violação detectada: ${v.matched_field} — "${v.matched_term}"`,
      details: { matchedTerm: v.matched_term, matchedField: v.matched_field, resolution: v.resolution },
      createdAt: v.created_at,
    }));

    type DuplicateRow = { id: string; org_id: string; org_name: string; fingerprint: string; expense_id: string; created_at: string };
    const duplicates = ((data?.duplicates ?? []) as DuplicateRow[]).map((f) => ({
      id: f.id,
      type: 'receipt_duplicate',
      severity: 'warning' as const,
      orgId: f.org_id,
      orgName: f.org_name,
      description: 'Recibo duplicado detectado',
      details: { fingerprint: f.fingerprint, expenseId: f.expense_id },
      createdAt: f.created_at,
    }));

    type DivergentRow = { id: string; org_id: string; org_name: string; expense_id: string; field: string | null; discrepancies: string[] | string | null; ocr_amount: number | null; ocr_date: string | null; ocr_vendor: string | null; expense_amount: number | null; expense_date: string | null; vendor_name: string | null; created_at: string };
    const divergentReceipts = ((data?.divergent_receipts ?? []) as DivergentRow[]).map((f) => {
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

    type RiskOrgRow = { id: string; name: string; health_score: number; billing_status: string };
    const riskQueue = ((data?.risk_orgs ?? []) as RiskOrgRow[]).map((o) => ({
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

    const response = NextResponse.json({
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
    response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=60');
    return response;
  } catch (error) {
    console.error('Get compliance error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
