import { NextRequest, NextResponse } from 'next/server';
import { mockOrganizations } from '@/lib/mock-data';
import { Organization, OrgStatus, Plan } from '@/lib/types';

// TODO: replace with real data source
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') as OrgStatus | null;
    const plan = searchParams.get('plan') as Plan | null;
    const healthBucket = searchParams.get('healthBucket');

    let filtered = [...mockOrganizations];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        o => o.name.toLowerCase().includes(searchLower) || o.slug.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (status) {
      filtered = filtered.filter(o => o.status === status);
    }

    // Plan filter
    if (plan) {
      filtered = filtered.filter(o => o.plan === plan);
    }

    // Health bucket filter
    if (healthBucket) {
      const [min, max] = healthBucket.split('-').map(Number);
      filtered = filtered.filter(o => o.healthScore >= min && o.healthScore <= max);
    }

    // Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = filtered.slice(offset, offset + limit);

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
    console.error('Get organizations error:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro interno do servidor', status: 500 },
      { status: 500 }
    );
  }
}
