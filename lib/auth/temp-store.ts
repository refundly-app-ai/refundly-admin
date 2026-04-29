// Temporary in-memory session store for development
// In production, use proper session management with iron-session

export interface TempSession {
  adminId: string;
  email: string;
  fullName: string;
  totpPending: boolean;
  totpVerified: boolean;
  enrollmentPending: boolean;
  createdAt: number;
}

// Simple in-memory store - resets on server restart
const sessions = new Map<string, TempSession>();

export function createTempSession(token: string, data: Omit<TempSession, 'createdAt'>): void {
  sessions.set(token, { ...data, createdAt: Date.now() });
}

export function getTempSession(token: string): TempSession | null {
  const session = sessions.get(token);
  if (!session) return null;
  
  // Expire after 30 minutes
  if (Date.now() - session.createdAt > 30 * 60 * 1000) {
    sessions.delete(token);
    return null;
  }
  
  return session;
}

export function updateTempSession(token: string, data: Partial<TempSession>): void {
  const session = sessions.get(token);
  if (session) {
    sessions.set(token, { ...session, ...data });
  }
}

export function deleteTempSession(token: string): void {
  sessions.delete(token);
}

export function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}
