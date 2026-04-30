import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';
import { logActivity } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';

    const { data: org, error: fetchError } = await supabaseAdmin
      .from('organizations')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !org) {
      return NextResponse.json({ ok: false, error: 'Organização não encontrada' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('organizations')
      .update({ status: 'active' })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await logActivity({
      adminId: session.adminId || null,
      action: 'org_reactivated',
      entity: 'organization',
      entityId: id,
      orgId: id,
      metadata: { previousStatus: org.status },
      ip,
      ua,
    });

    return NextResponse.json({ ok: true, data: { reactivated: true } });
  } catch (error) {
    console.error('Reactivate organization error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
