import { Activity } from './types';

// TODO: replace with real data source
// In-memory audit log for development
const auditLog: Activity[] = [];

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

export async function logActivity(params: LogActivityParams): Promise<Activity> {
  const activity: Activity = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    orgId: params.orgId ?? null,
    actorId: params.adminId,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    metadata: {
      ...params.metadata,
      userAgent: params.ua,
    },
    ip: params.ip ?? null,
    createdAt: new Date().toISOString(),
  };

  auditLog.unshift(activity);
  
  // Keep only last 10000 entries in memory
  if (auditLog.length > 10000) {
    auditLog.pop();
  }

  return activity;
}

export function getAuditLog(): Activity[] {
  return auditLog;
}

export function getAuditLogByOrg(orgId: string): Activity[] {
  return auditLog.filter(a => a.orgId === orgId);
}

export function getAuditLogByAdmin(adminId: string): Activity[] {
  return auditLog.filter(a => a.actorId === adminId);
}
