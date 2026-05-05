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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const neverLoggedIn = searchParams.get('neverLoggedIn');

    const offset = (page - 1) * limit;

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
      total_count: number;
    };

    if (neverLoggedIn === 'true') {
      // neverLoggedIn filter requires cross-referencing Supabase Auth — handled in JS
      const { data: rpcData, error } = await supabaseAdmin.rpc('superadmin_list_members', {
        p_limit: 10000,
        p_offset: 0,
        p_search: search || null,
        p_role: role || null,
      });

      if (error) {
        console.error('Get members error:', error);
        return NextResponse.json({ ok: false, error: 'Erro ao buscar membros' }, { status: 500 });
      }

      const pageSize = 500;
      let authUserPage = 1;
      const neverLoggedSet = new Set<string>();
      let hasMore = true;
      while (hasMore) {
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ page: authUserPage, perPage: pageSize });
        const users = authUsers?.users ?? [];
        for (const u of users) {
          if (!u.last_sign_in_at) neverLoggedSet.add(u.id);
        }
        hasMore = users.length === pageSize;
        authUserPage++;
      }

      const allItems = ((rpcData ?? []) as Row[])
        .filter((row) => neverLoggedSet.has(row.user_id))
        .map((row) => ({
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

      const total = allItems.length;
      const paginated = allItems.slice(offset, offset + limit);

      const res = NextResponse.json({
        ok: true,
        data: {
          items: paginated,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
      });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Default path: all filtering and pagination done in the database
    const { data: rpcData, error } = await supabaseAdmin.rpc('superadmin_list_members', {
      p_limit: limit,
      p_offset: offset,
      p_search: search || null,
      p_role: role || null,
    });

    if (error) {
      console.error('Get members error:', error);
      return NextResponse.json({ ok: false, error: 'Erro ao buscar membros' }, { status: 500 });
    }

    const rows = (rpcData ?? []) as Row[];
    const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

    const items = rows.map((row) => ({
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

    const res = NextResponse.json({
      ok: true,
      data: {
        items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
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
          { ok: false, error: 'Erro ao criar usuário' },
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
      return NextResponse.json({ ok: false, error: 'Erro ao atribuir função ao membro' }, { status: 500 });
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
