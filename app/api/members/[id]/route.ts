import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
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
          orgs: (orgs ?? []).map((o: any) => ({
            orgId: o.org_id,
            orgName: o.organizations?.name,
            orgSlug: o.organizations?.slug,
            role: o.role,
          })),
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
