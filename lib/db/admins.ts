import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyPassword } from '@/lib/auth/password';
import { decryptSecret } from '@/lib/auth/crypto';

export interface DbAdmin {
  id: string;
  email: string;
  full_name: string;
  password_hash: string;
  totp_secret: string | null;
  totp_enabled: boolean;
  totp_recovery_codes: string[] | null;
  is_active: boolean;
  role: string;
  failed_login_attempts: number;
  locked_until: string | null;
  last_login_at: string | null;
  last_login_ip: string | null;
}

export async function findAdminByEmail(email: string): Promise<DbAdmin | null> {
  const { data, error } = await supabaseAdmin
    .from('platform_admins')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !data) return null;
  return data as DbAdmin;
}

export async function findAdminById(id: string): Promise<DbAdmin | null> {
  const { data, error } = await supabaseAdmin
    .from('platform_admins')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as DbAdmin;
}

export async function verifyAdminPassword(admin: DbAdmin, password: string): Promise<boolean> {
  return verifyPassword(admin.password_hash, password);
}

export async function getDecryptedTotpSecret(admin: DbAdmin): Promise<string | null> {
  if (!admin.totp_secret) return null;
  return decryptSecret(admin.totp_secret);
}

export async function updateAdminTOTP(
  adminId: string,
  encryptedSecret: string,
  recoveryCodes: string[]
): Promise<void> {
  await supabaseAdmin
    .from('platform_admins')
    .update({
      totp_secret: encryptedSecret,
      totp_enabled: true,
      totp_recovery_codes: recoveryCodes,
    })
    .eq('id', adminId);
}

export async function updateAdminLastLogin(adminId: string, ip?: string): Promise<void> {
  await supabaseAdmin
    .from('platform_admins')
    .update({
      last_login_at: new Date().toISOString(),
      last_login_ip: ip ?? null,
      failed_login_attempts: 0,
      locked_until: null,
    })
    .eq('id', adminId);
}

export async function incrementFailedAttempts(adminId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from('platform_admins')
    .select('failed_login_attempts')
    .eq('id', adminId)
    .single();

  const newAttempts = ((data?.failed_login_attempts as number) || 0) + 1;
  const update: Record<string, unknown> = { failed_login_attempts: newAttempts };

  if (newAttempts >= 6) {
    update.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  }

  await supabaseAdmin
    .from('platform_admins')
    .update(update)
    .eq('id', adminId);

  return newAttempts;
}

export function isAccountLocked(admin: DbAdmin): boolean {
  if (!admin.locked_until) return false;
  return new Date(admin.locked_until) > new Date();
}

export async function useRecoveryCode(adminId: string, code: string): Promise<boolean> {
  const admin = await findAdminById(adminId);
  if (!admin || !admin.totp_recovery_codes) return false;

  const normalizedCode = code.toUpperCase().replace(/\s/g, '');
  const index = admin.totp_recovery_codes.indexOf(normalizedCode);
  if (index === -1) return false;

  const newCodes = [...admin.totp_recovery_codes];
  newCodes.splice(index, 1);

  await supabaseAdmin
    .from('platform_admins')
    .update({ totp_recovery_codes: newCodes })
    .eq('id', adminId);

  return true;
}
