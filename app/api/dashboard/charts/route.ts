import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';

const PT_MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date: Date): string {
  return `${PT_MONTHS[date.getUTCMonth()]}/${String(date.getUTCFullYear()).slice(-2)}`;
}

function hourKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}T${String(date.getUTCHours()).padStart(2, '0')}`;
}

function hourLabel(date: Date): string {
  return `${String(date.getUTCHours()).padStart(2, '0')}h`;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session.adminId || !session.totpVerified) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }

    const now = new Date();
    const twelveMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [orgsResult, eventsResult, requestsResult] = await Promise.all([
      supabaseAdmin
        .from('organizations')
        .select('id, billing_status, is_active, created_at')
        .gte('created_at', twelveMonthsAgo.toISOString()),
      supabaseAdmin
        .from('asaas_billing_events')
        .select('payload_json, status, created_at')
        .eq('status', 'processed')
        .gte('created_at', twelveMonthsAgo.toISOString()),
      supabaseAdmin
        .from('platform_audit_logs')
        .select('created_at')
        .gte('created_at', twentyFourHoursAgo.toISOString()),
    ]);

    const orgs = orgsResult.data ?? [];
    const events = eventsResult.data ?? [];
    const requests = requestsResult.data ?? [];

    // ── Build month buckets (last 12 months, in order) ─────────────────────
    const months: Array<{ key: string; label: string; date: Date }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      months.push({ key: monthKey(d), label: monthLabel(d), date: d });
    }

    // Signups by month (organizations created in that month)
    const signupsByMonth = new Map<string, number>();
    for (const org of orgs) {
      const k = monthKey(new Date(org.created_at));
      signupsByMonth.set(k, (signupsByMonth.get(k) ?? 0) + 1);
    }

    // MRR by month: prefer paid billing events; fall back to active orgs created in/up-to that month
    const mrrFromEvents = new Map<string, number>();
    for (const e of events) {
      const k = monthKey(new Date(e.created_at));
      const amount = (e.payload_json as any)?.payment?.value ?? 0;
      mrrFromEvents.set(k, (mrrFromEvents.get(k) ?? 0) + amount);
    }
    const useEvents = events.length > 0;

    const mrrSeries = months.map((m) => ({
      date: m.label,
      value: useEvents
        ? Math.round(mrrFromEvents.get(m.key) ?? 0)
        : 0,
    }));

    const signupsSeries = months.map((m) => ({
      date: m.label,
      value: signupsByMonth.get(m.key) ?? 0,
    }));

    // Tier distribution
    const tierCounts = new Map<string, number>();
    const { data: allOrgs } = await supabaseAdmin
      .from('organizations')
      .select('billing_status, is_active')
      .eq('is_active', true);

    for (const o of allOrgs ?? []) {
      const plan = (o as any).billing_status || 'free';
      tierCounts.set(plan, (tierCounts.get(plan) ?? 0) + 1);
    }

    const planLabels: Record<string, string> = {
      free: 'Gratuito',
      essential: 'Essencial',
      enterprise: 'Enterprise',
    };
    const tierDistribution = Array.from(tierCounts.entries())
      .map(([key, value]) => ({ name: planLabels[key] ?? key, value }))
      .sort((a, b) => b.value - a.value);

    // Requests last 24h (using platform audit log activity as proxy)
    const requestsByHour = new Map<string, number>();
    for (const r of requests) {
      const k = hourKey(new Date(r.created_at));
      requestsByHour.set(k, (requestsByHour.get(k) ?? 0) + 1);
    }

    const hours: Array<{ date: string; value: number }> = [];
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      hours.push({ date: hourLabel(d), value: requestsByHour.get(hourKey(d)) ?? 0 });
    }

    return NextResponse.json({
      ok: true,
      data: {
        mrrSeries,
        signupsSeries,
        tierDistribution,
        requestsSeries: hours,
      },
    });
  } catch (error) {
    console.error('Dashboard charts error:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
