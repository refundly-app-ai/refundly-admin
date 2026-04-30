import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Activity } from './types';

interface LogActivityParams {
  adminId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  orgId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  ua?: string | null;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await supabaseAdmin.from('platform_audit_logs').insert({
      admin_id: params.adminId,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId,
      org_id: params.orgId ?? null,
      metadata: {
        ...params.metadata,
        user_agent: params.ua,
      },
      ip: params.ip ?? null,
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

export async function getAuditLog(): Promise<Activity[]> {
  const { data } = await supabaseAdmin
    .from('platform_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  return (data || []).map(row => ({
    id: row.id,
    orgId: row.org_id,
    actorId: row.admin_id,
    action: row.action,
    entity: row.entity,
    entityId: row.entity_id,
    metadata: row.metadata || {},
    ip: row.ip,
    createdAt: row.created_at,
  }));
}

export async function getAuditLogByOrg(orgId: string): Promise<Activity[]> {
  const { data } = await supabaseAdmin
    .from('platform_audit_logs')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(100);

  return (data || []).map(row => ({
    id: row.id,
    orgId: row.org_id,
    actorId: row.admin_id,
    action: row.action,
    entity: row.entity,
    entityId: row.entity_id,
    metadata: row.metadata || {},
    ip: row.ip,
    createdAt: row.created_at,
  }));
}
