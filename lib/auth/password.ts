// Password hashing utilities using argon2
// TODO: replace with real argon2 when deploying to production
// For development, we use a simple mock that simulates argon2 behavior

const MOCK_HASH_PREFIX = '$argon2id$v=19$m=65536,t=3,p=4$';

export async function hashPassword(password: string): Promise<string> {
  // In production, use: return argon2.hash(password);
  // Mock implementation for development
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return MOCK_HASH_PREFIX + hashHex;
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  // In production, use: return argon2.verify(hash, password);
  // Mock implementation for development
  const newHash = await hashPassword(password);
  return hash === newHash;
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
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(generateRecoveryCode());
  }
  return codes;
}
