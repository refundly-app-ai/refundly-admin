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

async function probeDatabase(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const { error } = await supabaseAdmin
      .from('platform_admins')
      .select('id', { count: 'exact', head: true })
      .limit(1);
    const latency = Date.now() - start;

    if (error) {
      return { service: 'Supabase Postgres', status: 'down', latency, uptime: 0, lastChecked: new Date().toISOString() };
    }
    return {
      service: 'Supabase Postgres',
      status: latency < 300 ? 'healthy' : latency < 1000 ? 'degraded' : 'down',
      latency,
      uptime: 99.9,
      lastChecked: new Date().toISOString(),
    };
  } catch {
    return { service: 'Supabase Postgres', status: 'down', latency: Date.now() - start, uptime: 0, lastChecked: new Date().toISOString() };
  }
}

async function probeRedis(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const result = await redis.ping();
    const latency = Date.now() - start;

    if (result !== 'PONG') {
      return { service: 'Upstash Redis', status: 'degraded', latency, uptime: 99, lastChecked: new Date().toISOString() };
    }
    return {
      service: 'Upstash Redis',
      status: latency < 200 ? 'healthy' : latency < 800 ? 'degraded' : 'down',
      latency,
      uptime: 99.9,
      lastChecked: new Date().toISOString(),
    };
  } catch {
    return { service: 'Upstash Redis', status: 'down', latency: Date.now() - start, uptime: 0, lastChecked: new Date().toISOString() };
  }
}

async function probeStorage(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const { error } = await supabaseAdmin.storage.listBuckets();
    const latency = Date.now() - start;
    if (error) {
      return { service: 'Supabase Storage', status: 'degraded', latency, uptime: 99, lastChecked: new Date().toISOString() };
    }
    return {
      service: 'Supabase Storage',
      status: latency < 500 ? 'healthy' : latency < 1500 ? 'degraded' : 'down',
      latency,
      uptime: 99.9,
      lastChecked: new Date().toISOString(),
    };
  } catch {
    return { service: 'Supabase Storage', status: 'down', latency: Date.now() - start, uptime: 0, lastChecked: new Date().toISOString() };
  }
}

async function probeAuth(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const { error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    const latency = Date.now() - start;
    if (error) {
      return { service: 'Supabase Auth', status: 'degraded', latency, uptime: 99, lastChecked: new Date().toISOString() };
    }
    return {
      service: 'Supabase Auth',
      status: latency < 500 ? 'healthy' : latency < 1500 ? 'degraded' : 'down',
      latency,
      uptime: 99.9,
      lastChecked: new Date().toISOString(),
    };
  } catch {
    return { service: 'Supabase Auth', status: 'down', latency: Date.now() - start, uptime: 0, lastChecked: new Date().toISOString() };
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
    ]);

    return NextResponse.json({ ok: true, data: services });
  } catch (error) {
    console.error('System health error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
