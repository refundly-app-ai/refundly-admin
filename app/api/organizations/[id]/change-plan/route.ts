import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mockOrganizations } from '@/lib/mock-data';
import { getSession } from '@/lib/auth/session';
import { logActivity } from '@/lib/audit';
import { Plan } from '@/lib/types';

const changePlanSchema = z.object({
  newPlan: z.enum(['free', 'basic', 'pro']),
  confirmSlug: z.string(),
});

// TODO: replace with real data source
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';

    const body = await request.json();
    const validation = changePlanSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.errors[0].message, status: 400 },
        { status: 400 }
      );
    }

    const org = mockOrganizations.find(o => o.id === id);
    if (!org) {
      return NextResponse.json(
        { ok: false, error: 'Organização não encontrada', status: 404 },
        { status: 404 }
      );
    }

    if (validation.data.confirmSlug !== org.slug) {
      return NextResponse.json(
        { ok: false, error: 'Slug de confirmação não confere', status: 400 },
        { status: 400 }
      );
    }

    const previousPlan = org.plan;
    org.plan = validation.data.newPlan as Plan;

    await logActivity({
      adminId: session.adminId || null,
      action: 'org_plan_changed',
      entity: 'organization',
      entityId: id,
      orgId: id,
      metadata: { previousPlan, newPlan: validation.data.newPlan },
      ip,
      ua,
    });

    return NextResponse.json({
      ok: true,
      data: { planChanged: true, newPlan: validation.data.newPlan },
    });
  } catch (error) {
    console.error('Change plan error:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro interno do servidor', status: 500 },
      { status: 500 }
    );
  }
}
