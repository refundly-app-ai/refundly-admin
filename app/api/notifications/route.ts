import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface Notification {
  id: string;
  type: 'org' | 'billing' | 'security' | 'compliance' | 'system';
  title: string;
  description?: string;
  severity: 'info' | 'warning' | 'critical';
  createdAt: string;
  link?: string;
}

type NotificationCtx = {
  id: string;
  action: string;
  org_id: string | null;
  metadata: Record<string, string> | null;
  orgName: string | null;
};

type Template = {
  type: Notification['type'];
  severity: Notification['severity'];
  title: (m: NotificationCtx) => string;
  description?: (m: NotificationCtx) => string | undefined;
};

const ACTION_TEMPLATES: Record<string, Template> = {
  org_suspended: {
    type: 'org',
    severity: 'warning',
    title: (m) => `Organização suspensa: ${m.orgName ?? '—'}`,
    description: (m) => (m.metadata?.reason ? `Motivo: ${m.metadata.reason}` : undefined),
  },
  org_reactivated: {
    type: 'org',
    severity: 'info',
    title: (m) => `Organização reativada: ${m.orgName ?? '—'}`,
  },
  org_plan_changed: {
    type: 'billing',
    severity: 'info',
    title: (m) => `Plano alterado: ${m.orgName ?? '—'}`,
    description: (m) =>
      m.metadata?.previousPlan && m.metadata?.newPlan
        ? `${m.metadata.previousPlan} → ${m.metadata.newPlan}`
        : undefined,
  },
  member_banned: {
    type: 'security',
    severity: 'warning',
    title: () => 'Usuário banido',
    description: (m) => (m.metadata?.reason ? String(m.metadata.reason) : undefined),
  },
  login_failed: {
    type: 'security',
    severity: 'critical',
    title: () => 'Tentativa de login falhada',
    description: (m) => (m.metadata?.email ? `Tentativa para ${m.metadata.email}` : undefined),
  },
  admin_invited: {
    type: 'security',
    severity: 'info',
    title: (m) => `Novo admin convidado: ${m.metadata?.email ?? '—'}`,
  },
  admin_revoked: {
    type: 'security',
    severity: 'warning',
    title: () => 'Acesso de admin revogado',
  },
  admin_2fa_reset: {
    type: 'security',
    severity: 'warning',
    title: () => '2FA de admin foi resetado',
  },
};

export async function GET() {
  try {
    const session = await getSession();
    if (!session.adminId || !session.totpVerified) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }

    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('platform_audit_logs')
      .select('id, action, entity, entity_id, org_id, metadata, created_at, organizations(name)')
      .in('action', Object.keys(ACTION_TEMPLATES))
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ ok: true, data: [] });
    }

    const notifications: Notification[] = (data ?? []).map((row) => {
      const tpl = ACTION_TEMPLATES[row.action];
      const orgsArr = row.organizations;
      const orgName = Array.isArray(orgsArr) ? (orgsArr[0]?.name ?? null) : null;
      const ctx: NotificationCtx = {
        id: row.id,
        action: row.action,
        org_id: row.org_id,
        metadata: row.metadata as Record<string, string> | null,
        orgName,
      };
      return {
        id: row.id,
        type: tpl.type,
        severity: tpl.severity,
        title: tpl.title(ctx),
        description: tpl.description?.(ctx),
        createdAt: row.created_at,
        link: row.org_id ? `/dashboard/organizations/${row.org_id}` : undefined,
      };
    });

    return NextResponse.json({ ok: true, data: notifications });
  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json({ ok: true, data: [] });
  }
}
