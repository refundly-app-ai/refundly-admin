import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';
import { logActivity } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.adminId || !session.totpVerified) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const banned = searchParams.get('banned');
    const neverLoggedIn = searchParams.get('neverLoggedIn');

    const { data: rpcData, error } = await supabaseAdmin.rpc('superadmin_list_members');

    if (error) {
      console.error('Get members error:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    type Row = {
      user_id: string;
      role: string;
      org_id: string;
      is_active: boolean;
      full_name: string | null;
      email: string | null;
      whatsapp_verified: boolean | null;
      org_name: string | null;
      org_slug: string | null;
    };

    let items = (rpcData ?? [] as Row[]).map((row: Row) => ({
      id: row.user_id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      orgId: row.org_id,
      orgName: row.org_name,
      orgSlug: row.org_slug,
      isActive: row.is_active,
      whatsappVerified: row.whatsapp_verified ?? false,
    }));

    const offset = (page - 1) * limit;

    if (role) {
      items = items.filter((m) => m.role === role);
    }

    if (search) {
      const s = search.toLowerCase();
      items = items.filter(
        (m) =>
          m.email?.toLowerCase().includes(s) ||
          m.fullName?.toLowerCase().includes(s)
      );
    }

    if (neverLoggedIn === 'true') {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const neverLoggedSet = new Set(
        (authUsers?.users ?? [])
          .filter((u) => !u.last_sign_in_at)
          .map((u) => u.id)
      );
      items = items.filter((m) => neverLoggedSet.has(m.id));
    }

    const total = items.length;
    const paginated = items.slice(offset, offset + limit);

    return NextResponse.json({
      ok: true,
      data: {
        items: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get members error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

const inviteMemberSchema = z.object({
  email: z.string().email('E-mail inválido'),
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  orgId: z.string().uuid('ID da organização inválido'),
  role: z.enum(['admin', 'colaborador', 'aprovador']).default('colaborador'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';

    const body = await request.json();
    const validation = inviteMemberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, fullName, orgId, role } = validation.data;

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    let userId: string;

    if (existingProfile?.id) {
      userId = existingProfile.id as string;
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      if (createError || !newUser?.user) {
        console.error('Create user error:', createError);
        return NextResponse.json(
          { ok: false, error: createError?.message ?? 'Erro ao criar usuário' },
          { status: 500 }
        );
      }

      userId = newUser.user.id;

      await supabaseAdmin.from('profiles').upsert({
        id: userId,
        email,
        full_name: fullName,
      });
    }

    const { error: roleError } = await supabaseAdmin.from('user_org_roles').upsert({
      user_id: userId,
      org_id: orgId,
      role,
    });

    if (roleError) {
      console.error('Assign role error:', roleError);
      return NextResponse.json({ ok: false, error: roleError.message }, { status: 500 });
    }

    await logActivity({
      adminId: session.adminId || null,
      action: 'member_invited',
      entity: 'member',
      entityId: userId,
      orgId,
      metadata: { email, fullName, role },
      ip,
      ua,
    });

    return NextResponse.json({ ok: true, data: { userId } }, { status: 201 });
  } catch (error) {
    console.error('Invite member error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
