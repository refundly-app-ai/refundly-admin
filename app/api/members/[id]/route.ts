import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';
import { logActivity } from '@/lib/audit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ ok: false, error: 'Membro não encontrado' }, { status: 404 });
    }

    const { data: orgs } = await supabaseAdmin
      .from('user_org_roles')
      .select('role, org_id, organizations(name, slug)')
      .eq('user_id', id);

    const { data: activities } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('actor_id', id)
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id);

    return NextResponse.json({
      ok: true,
      data: {
        member: {
          id,
          email: authUser?.user?.email ?? profile.email,
          fullName: profile.full_name,
          banned: profile.banned ?? false,
          whatsappVerified: profile.whatsapp_verified ?? false,
          createdAt: authUser?.user?.created_at ?? profile.created_at,
          lastSignInAt: authUser?.user?.last_sign_in_at ?? null,
          orgs: (orgs ?? []).map((o) => {
            const orgRel = o.organizations as unknown as { name: string; slug: string } | null;
            return {
              orgId: o.org_id,
              orgName: orgRel?.name,
              orgSlug: orgRel?.slug,
              role: o.role,
            };
          }),
        },
        activities: activities ?? [],
        sessions: [],
      },
    });
  } catch (error) {
    console.error('Get member error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

const patchMemberSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  email: z.string().email('E-mail inválido').optional(),
  role: z.enum(['owner', 'admin', 'member', 'viewer']).optional(),
  orgId: z.string().uuid().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';

    const body = await request.json();
    const validation = patchMemberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { fullName, email, role, orgId } = validation.data;

    if (fullName) {
      await supabaseAdmin.from('profiles').update({ full_name: fullName }).eq('id', id);
    }

    if (email) {
      await supabaseAdmin.auth.admin.updateUserById(id, { email });
      await supabaseAdmin.from('profiles').update({ email }).eq('id', id);
    }

    if (role && orgId) {
      await supabaseAdmin
        .from('user_org_roles')
        .update({ role })
        .eq('user_id', id)
        .eq('org_id', orgId);
    }

    await logActivity({
      adminId: session.adminId || null,
      action: 'member_updated',
      entity: 'member',
      entityId: id,
      metadata: { fullName, email, role, orgId },
      ip,
      ua,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Patch member error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
