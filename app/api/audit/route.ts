import { NextRequest, NextResponse } from 'next/server';
import { mockActivities } from '@/lib/mock-data';
import { getAuditLog } from '@/lib/audit';

// TODO: replace with real data source
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type'); // 'platform' or 'tenant'
    const actor = searchParams.get('actor');
    const org = searchParams.get('org');
    const action = searchParams.get('action');
    const entity = searchParams.get('entity');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Combine mock activities with real-time audit log
    const realtimeAudit = getAuditLog();
    let allActivities = [...realtimeAudit, ...mockActivities];

    // Type filter (platform actions have no orgId)
    if (type === 'platform') {
      allActivities = allActivities.filter(a => !a.orgId || a.entity === 'auth' || a.entity === 'admin');
    } else if (type === 'tenant') {
      allActivities = allActivities.filter(a => a.orgId);
    }

    // Actor filter
    if (actor) {
      allActivities = allActivities.filter(a => a.actorId === actor);
    }

    // Org filter
    if (org) {
      allActivities = allActivities.filter(a => a.orgId === org);
    }

    // Action filter
    if (action) {
      allActivities = allActivities.filter(a => a.action.includes(action));
    }

    // Entity filter
    if (entity) {
      allActivities = allActivities.filter(a => a.entity === entity);
    }

    // Date filters
    if (startDate) {
      const start = new Date(startDate);
      allActivities = allActivities.filter(a => new Date(a.createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      allActivities = allActivities.filter(a => new Date(a.createdAt) <= end);
    }

    // Sort by date descending
    allActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const total = allActivities.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = allActivities.slice(offset, offset + limit);

    return NextResponse.json({
      ok: true,
      data: {
        items: data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error('Get audit error:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro interno do servidor', status: 500 },
      { status: 500 }
    );
  }
}
