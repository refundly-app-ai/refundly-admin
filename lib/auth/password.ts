import { hash, verify } from 'argon2';

export async function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export async function verifyPassword(hashStr: string, password: string): Promise<boolean> {
  return verify(hashStr, password);
}

export function generateRecoveryCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateRecoveryCodes(count: number = 10): string[] {
  return Array.from({ length: count }, generateRecoveryCode);
}
