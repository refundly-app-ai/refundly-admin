import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { hashPassword } from '@/lib/auth/password';
import { logActivity } from '@/lib/audit';
import { randomBytes } from 'crypto';

const createSchema = z.object({
  email: z.string().email('E-mail inválido'),
  fullName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session.adminId || !session.totpVerified) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('platform_admins')
      .select('id, email, full_name, totp_enabled, last_login_at, last_login_ip, is_active, created_at, created_by')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('List admins error:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const admins = (data ?? []).map((row: any) => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      totpEnabled: row.totp_enabled,
      lastLoginAt: row.last_login_at,
      lastLoginIp: row.last_login_ip,
      isActive: row.is_active,
      createdAt: row.created_at,
      createdBy: row.created_by,
      isSelf: row.id === session.adminId,
    }));

    return NextResponse.json({ ok: true, data: admins });
  } catch (error) {
    console.error('List admins error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

function generateTempPassword(): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
  const bytes = randomBytes(20);
  let pwd = '';
  for (let i = 0; i < 20; i++) {
    pwd += charset[bytes[i] % charset.length];
  }
  return pwd;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.adminId || !session.totpVerified) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';

    const body = await request.json();
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, fullName } = validation.data;
    const normalizedEmail = email.toLowerCase();

    const { data: existing } = await supabaseAdmin
      .from('platform_admins')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: false, error: 'Já existe um admin com este e-mail' }, { status: 409 });
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const { data, error } = await supabaseAdmin
      .from('platform_admins')
      .insert({
        email: normalizedEmail,
        full_name: fullName,
        password_hash: passwordHash,
        totp_enabled: false,
        is_active: true,
        created_by: session.adminId,
      })
      .select('id, email, full_name, is_active, totp_enabled, created_at')
      .single();

    if (error) {
      console.error('Create admin error:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await logActivity({
      adminId: session.adminId,
      action: 'admin_invited',
      entity: 'platform_admin',
      entityId: data.id,
      metadata: { email: normalizedEmail, fullName },
      ip,
      ua,
    });

    return NextResponse.json({
      ok: true,
      data: {
        admin: {
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          isActive: data.is_active,
          totpEnabled: data.totp_enabled,
          createdAt: data.created_at,
        },
        tempPassword,
      },
    });
  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
