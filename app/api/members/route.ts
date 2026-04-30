import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';
import { logActivity } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const banned = searchParams.get('banned');
    const neverLoggedIn = searchParams.get('neverLoggedIn');

    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('user_org_roles')
      .select(`
        user_id,
        role,
        org_id,
        profiles!inner(full_name, email, whatsapp_verified, banned),
        organizations!inner(name, slug)
      `, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('user_id');

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Get members error:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    type Row = {
      user_id: string;
      role: string;
      org_id: string;
      profiles: unknown;
      organizations: unknown;
    };

    let items = (data ?? []).map((row: Row) => {
      const profile = row.profiles as { full_name: string | null; email: string | null; whatsapp_verified: boolean | null; banned: boolean | null } | null;
      const org = row.organizations as { name: string | null; slug: string | null } | null;
      return {
        id: row.user_id,
        email: profile?.email,
        fullName: profile?.full_name,
        role: row.role,
        orgId: row.org_id,
        orgName: org?.name,
        orgSlug: org?.slug,
        banned: profile?.banned ?? false,
        whatsappVerified: profile?.whatsapp_verified ?? false,
      };
    });

    if (search) {
      const s = search.toLowerCase();
      items = items.filter(
        (m) =>
          m.email?.toLowerCase().includes(s) ||
          m.fullName?.toLowerCase().includes(s)
      );
    }

    if (banned === 'true') {
      items = items.filter((m) => m.banned);
    } else if (banned === 'false') {
      items = items.filter((m) => !m.banned);
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

    return NextResponse.json({
      ok: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total: count ?? items.length,
          totalPages: Math.ceil((count ?? items.length) / limit),
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
  role: z.enum(['owner', 'admin', 'member', 'viewer']).default('member'),
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
