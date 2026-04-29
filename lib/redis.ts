import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// Session management
export async function createSession(adminId: string, sessionData: Record<string, unknown>) {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  await redis.set(`session:${sessionId}`, JSON.stringify({ adminId, ...sessionData }), { ex: 86400 }); // 24 hours
  return sessionId;
}

export async function getSession(sessionId: string) {
  const session = await redis.get<string>(`session:${sessionId}`);
  if (!session) return null;
  return typeof session === 'string' ? JSON.parse(session) : session;
}

export async function deleteSession(sessionId: string) {
  await redis.del(`session:${sessionId}`);
}

// Real-time metrics caching
export async function cacheMetrics(key: string, data: unknown, ttl = 300) {
  await redis.set(`metrics:${key}`, JSON.stringify(data), { ex: ttl });
}

export async function getCachedMetrics<T>(key: string): Promise<T | null> {
  const cached = await redis.get<string>(`metrics:${key}`);
  if (!cached) return null;
  return typeof cached === 'string' ? JSON.parse(cached) : cached;
}

// Rate limiting
export async function checkRateLimit(identifier: string, limit = 100, window = 60) {
  const key = `ratelimit:${identifier}`;
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, window);
  }
  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
    reset: await redis.ttl(key),
  };
}

// Audit log queue
export async function queueAuditLog(logEntry: Record<string, unknown>) {
  await redis.lpush('audit:queue', JSON.stringify(logEntry));
}

export async function getRecentActivity(count = 10) {
  const activities = await redis.lrange('activity:recent', 0, count - 1);
  return activities.map((a) => (typeof a === 'string' ? JSON.parse(a) : a));
}

export async function addRecentActivity(activity: Record<string, unknown>) {
  await redis.lpush('activity:recent', JSON.stringify(activity));
  await redis.ltrim('activity:recent', 0, 99); // Keep last 100 activities
}
