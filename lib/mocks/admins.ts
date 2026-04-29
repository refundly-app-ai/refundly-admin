import { PlatformAdmin } from '../types';
import { hashPassword } from '../auth/password';

// TODO: replace with real data source
// Mock admins for development - passwords are hashed versions of simple passwords

export interface MockAdmin extends PlatformAdmin {
  passwordHash: string;
  totpSecret: string | null;
  recoveryCodes: string[];
}

// Pre-computed hash for "admin123" - in real app, use argon2
const MOCK_PASSWORD_HASH = '$argon2id$v=19$m=65536,t=3,p=4$8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';

export const MOCK_ADMINS: MockAdmin[] = [
  {
    id: 'admin_1',
    email: 'admin@example.com',
    fullName: 'Super Admin',
    passwordHash: MOCK_PASSWORD_HASH,
    totpEnabled: true,
    totpSecret: 'JBSWY3DPEHPK3PXP', // Test secret - generates predictable codes
    recoveryCodes: ['AAAA1111BBBB', 'CCCC2222DDDD', 'EEEE3333FFFF'],
    lastLoginAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'admin_2',
    email: 'ops@example.com',
    fullName: 'Operations Admin',
    passwordHash: MOCK_PASSWORD_HASH,
    totpEnabled: false,
    totpSecret: null,
    recoveryCodes: [],
    lastLoginAt: null,
    isActive: true,
  },
  {
    id: 'admin_3',
    email: 'support@example.com',
    fullName: 'Support Admin',
    passwordHash: MOCK_PASSWORD_HASH,
    totpEnabled: true,
    totpSecret: 'GEZDGNBVGY3TQOJQ',
    recoveryCodes: ['XXXX1111YYYY', 'ZZZZ2222WWWW'],
    lastLoginAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    isActive: true,
  },
];

export function findAdminByEmail(email: string): MockAdmin | undefined {
  return MOCK_ADMINS.find(a => a.email.toLowerCase() === email.toLowerCase());
}

export function findAdminById(id: string): MockAdmin | undefined {
  return MOCK_ADMINS.find(a => a.id === id);
}

export async function verifyAdminPassword(admin: MockAdmin, password: string): Promise<boolean> {
  // For mock, accept "admin123" as password for all admins
  return password === 'admin123';
}

export function updateAdminTOTP(adminId: string, totpSecret: string, recoveryCodes: string[]): void {
  const admin = MOCK_ADMINS.find(a => a.id === adminId);
  if (admin) {
    admin.totpEnabled = true;
    admin.totpSecret = totpSecret;
    admin.recoveryCodes = recoveryCodes;
  }
}

export function useRecoveryCode(adminId: string, code: string): boolean {
  const admin = MOCK_ADMINS.find(a => a.id === adminId);
  if (!admin) return false;
  
  const index = admin.recoveryCodes.indexOf(code.toUpperCase().replace(/\s/g, ''));
  if (index === -1) return false;
  
  admin.recoveryCodes.splice(index, 1);
  return true;
}

export function updateAdminLastLogin(adminId: string): void {
  const admin = MOCK_ADMINS.find(a => a.id === adminId);
  if (admin) {
    admin.lastLoginAt = new Date().toISOString();
  }
}
