// Organization Types
export type OrgStatus = 'active' | 'suspended' | 'blocked' | 'churned' | 'trial';
export type OrganizationStatus = OrgStatus;
export type Plan = 'free' | 'essential' | 'enterprise';
export type OrganizationTier = Plan;

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  status: OrgStatus;
  plan: Plan;
  tier?: Plan;
  memberCount?: number;
  membersCount?: number;
  mrr: number;
  createdAt: string;
  lastActiveAt?: string;
  domain?: string;
  industry?: string;
  country?: string;
  healthScore?: number;
  complianceScore?: number;
  featureFlags?: string[];
  monthlyUsage?: number;
  monthlyLimit?: number;
  firstActivityAt?: string | null;
  activeMembers30d?: number;
  lastAdminLoginAt?: string | null;
}

// Member Types
export type MemberRole = 'admin' | 'colaborador' | 'aprovador';
export type MemberStatus = 'active' | 'invited' | 'suspended' | 'deactivated';

export interface Member {
  id: string;
  email: string;
  name?: string;
  fullName?: string;
  avatar?: string;
  organizationId?: string;
  organizationName?: string;
  role?: MemberRole;
  status?: MemberStatus;
  banned?: boolean;
  lastLoginAt?: string;
  lastSignInAt?: string;
  createdAt: string;
  mfaEnabled?: boolean;
  sessionsCount?: number;
  orgs?: Array<{ orgId: string; orgName: string; role: MemberRole | string }>;
  verifiedChannel?: string | null;
}

// Platform Admin Types
export interface PlatformAdmin {
  id: string;
  email: string;
  fullName: string;
  totpEnabled: boolean;
  lastLoginAt: string | null;
  isActive: boolean;
}

// Activity / Audit Log Types
export interface Activity {
  id: string;
  orgId: string | null;
  actorId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  ip: string | null;
  createdAt: string;
}

// Admin User Types
export type AdminRole = 'super_admin' | 'admin' | 'support' | 'viewer';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: AdminRole;
  permissions: string[];
  lastLoginAt: string;
  mfaEnabled: boolean;
}

// Audit Log Types
export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.suspended'
  | 'org.created'
  | 'org.updated'
  | 'org.deleted'
  | 'org.suspended'
  | 'billing.subscription_created'
  | 'billing.subscription_updated'
  | 'billing.invoice_paid'
  | 'settings.updated'
  | 'feature_flag.toggled'
  | 'impersonation.started'
  | 'impersonation.ended';

export interface AuditLog {
  id: string;
  action: AuditAction;
  actorId: string;
  actorName: string;
  actorType: 'admin' | 'user' | 'system';
  targetType?: 'user' | 'organization' | 'subscription' | 'settings';
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// Compliance Types
export type ComplianceStatus = 'compliant' | 'non_compliant' | 'pending_review';
export type ComplianceFramework = 'SOC2' | 'GDPR' | 'HIPAA' | 'ISO27001' | 'PCI_DSS';

export interface ComplianceReport {
  id: string;
  organizationId: string;
  organizationName: string;
  framework: ComplianceFramework;
  status: ComplianceStatus;
  score: number;
  lastAuditDate: string;
  nextAuditDate: string;
  issues: number;
  criticalIssues: number;
}

export interface DataRetentionPolicy {
  id: string;
  organizationId: string;
  dataType: string;
  retentionDays: number;
  deletionScheduled?: string;
  autoDelete: boolean;
}

// Integration Types
export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'syncing' | 'degraded';

export interface Integration {
  id: string;
  name?: string;
  provider?: string;
  icon?: string;
  status: IntegrationStatus;
  orgId?: string;
  organizationId?: string;
  organizationName?: string;
  connectedAt?: string;
  lastSyncAt?: string;
  lastSeenAt?: string;
  errorMessage?: string;
  lastError?: string;
  kind?: string;
  config?: Record<string, unknown>;
}

// Billing Types
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';

export interface Subscription {
  id: string;
  organizationId: string;
  organizationName: string;
  plan: string;
  status: SubscriptionStatus;
  mrr: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface Invoice {
  id: string;
  organizationId: string;
  organizationName: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  dueDate: string;
  paidAt?: string;
  invoiceUrl?: string;
}

export interface BillingEvent {
  id: string;
  type: string;
  amount?: number;
  status: string;
  createdAt: string;
}

// Operations Types
export interface SystemHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  uptime: number;
  lastChecked: string;
}

export interface QueueJob {
  id: string;
  queue: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  payload: Record<string, unknown>;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// Feature Flag Types
export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetOrganizations?: string[];
  targetTiers?: Plan[];
  createdAt: string;
  updatedAt: string;
}

// Dashboard Metrics
export interface DashboardMetrics {
  totalOrganizations: number;
  totalMembers: number;
  totalMRR: number;
  activeTrials: number;
  churnRate: number;
  growthRate: number;
  avgHealthScore: number;
  avgComplianceScore: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}
