import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redis } from '@/lib/redis';

interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  uptime: number;
  lastChecked: string;
}

function result(
  service: string,
  status: 'healthy' | 'degraded' | 'down',
  latency: number,
  uptime = 99.9,
): ServiceHealth {
  return { service, status, latency, uptime, lastChecked: new Date().toISOString() };
}

async function probeDatabase(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const { error } = await supabaseAdmin.rpc('ping');
    const ms = Date.now() - start;
    if (error) return result('Supabase Postgres', 'down', ms, 0);
    return result('Supabase Postgres', ms < 800 ? 'healthy' : ms < 2500 ? 'degraded' : 'down', ms);
  } catch {
    return result('Supabase Postgres', 'down', Date.now() - start, 0);
  }
}

async function probeRedis(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const pong = await redis.ping();
    const ms = Date.now() - start;
    if (pong !== 'PONG') return result('Upstash Redis', 'degraded', ms);
    return result('Upstash Redis', ms < 400 ? 'healthy' : ms < 1500 ? 'degraded' : 'down', ms);
  } catch {
    return result('Upstash Redis', 'down', Date.now() - start, 0);
  }
}

async function probeAuth(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const { error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    const ms = Date.now() - start;
    if (error) return result('Supabase Auth', 'degraded', ms);
    return result('Supabase Auth', ms < 1000 ? 'healthy' : ms < 3000 ? 'degraded' : 'down', ms);
  } catch {
    return result('Supabase Auth', 'down', Date.now() - start, 0);
  }
}

async function probeStorage(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const { error } = await supabaseAdmin.storage.listBuckets();
    const ms = Date.now() - start;
    if (error) return result('Supabase Storage', 'degraded', ms);
    return result('Supabase Storage', ms < 1000 ? 'healthy' : ms < 3000 ? 'degraded' : 'down', ms);
  } catch {
    return result('Supabase Storage', 'down', Date.now() - start, 0);
  }
}

async function probeAsaas(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const res = await fetch('https://status.asaas.com/api/v2/status.json', {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 0 },
    });
    const ms = Date.now() - start;
    if (!res.ok) return result('Asaas (Pagamentos)', 'degraded', ms);
    const json = await res.json();
    const indicator: string = json?.status?.indicator ?? 'unknown';
    const status =
      indicator === 'none' ? 'healthy' :
      indicator === 'minor' ? 'degraded' : 'down';
    return result('Asaas (Pagamentos)', status, ms);
  } catch {
    return result('Asaas (Pagamentos)', 'down', Date.now() - start, 0);
  }
}

async function probeSMTP(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '465');
    if (!host) return result('SMTP (Email)', 'down', 0, 0);

    const net = await import('net');
    await new Promise<void>((resolve, reject) => {
      const socket = net.createConnection({ host, port: port, timeout: 5000 });
      socket.once('connect', () => { socket.destroy(); resolve(); });
      socket.once('timeout', () => { socket.destroy(); reject(new Error('timeout')); });
      socket.once('error', reject);
    });

    const ms = Date.now() - start;
    return result('SMTP (Email)', ms < 1000 ? 'healthy' : 'degraded', ms);
  } catch {
    return result('SMTP (Email)', 'down', Date.now() - start, 0);
  }
}

async function probeWhatsApp(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const apiUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;
    if (!apiUrl || !apiKey) return result('WhatsApp', 'down', 0, 0);

    const res = await fetch(`${apiUrl}/instance/fetchInstances`, {
      headers: { apikey: apiKey },
      signal: AbortSignal.timeout(5000),
    });

    const ms = Date.now() - start;
    if (!res.ok) return result('WhatsApp', 'down', ms, 0);

    type InstanceEntry = { instance?: { state?: string }; connectionStatus?: string };
    const json: unknown = await res.json();
    const instances: InstanceEntry[] = Array.isArray(json) ? (json as InstanceEntry[]) : [];

    if (instances.length === 0) return result('WhatsApp', 'degraded', ms);

    const hasConnected = instances.some(
      (i) => i.instance?.state === 'open' || i.connectionStatus === 'open',
    );
    const hasConnecting = instances.some((i) =>
      ['connecting', 'qr_ready'].includes(i.instance?.state ?? i.connectionStatus ?? ''),
    );

    const status = hasConnected ? 'healthy' : hasConnecting ? 'degraded' : 'down';
    return result('WhatsApp', status, ms);
  } catch {
    return result('WhatsApp', 'down', Date.now() - start, 0);
  }
}

async function probeWebhooks(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabaseAdmin
      .from('webhook_logs')
      .select('status, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(20);

    const ms = Date.now() - start;
    if (error) return result('Webhooks', 'down', ms, 0);
    if (!data || data.length === 0) return result('Webhooks', 'degraded', ms);

    const total = data.length;
    const failed = data.filter((w) => w.status === 'failed' || w.status === 'error').length;
    const failRate = failed / total;

    const status =
      failRate === 0 ? 'healthy' :
      failRate < 0.3 ? 'degraded' : 'down';

    return result('Webhooks', status, ms);
  } catch {
    return result('Webhooks', 'down', Date.now() - start, 0);
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session.adminId || !session.totpVerified) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }

    const services = await Promise.all([
      probeDatabase(),
      probeRedis(),
      probeAuth(),
      probeStorage(),
      probeAsaas(),
      probeSMTP(),
      probeWhatsApp(),
      probeWebhooks(),
    ]);

    return NextResponse.json({ ok: true, data: services });
  } catch (error) {
    console.error('System health error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
