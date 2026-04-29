import { NextRequest, NextResponse } from 'next/server';
import { mockMembers } from '@/lib/mock-data';

// TODO: replace with real data source
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const banned = searchParams.get('banned');
    const neverLoggedIn = searchParams.get('neverLoggedIn');

    let filtered = [...mockMembers];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        m => m.email.toLowerCase().includes(searchLower) || m.fullName.toLowerCase().includes(searchLower)
      );
    }

    // Role filter
    if (role) {
      filtered = filtered.filter(m => m.orgs.some(o => o.role === role));
    }

    // Banned filter
    if (banned === 'true') {
      filtered = filtered.filter(m => m.banned);
    } else if (banned === 'false') {
      filtered = filtered.filter(m => !m.banned);
    }

    // Never logged in filter
    if (neverLoggedIn === 'true') {
      filtered = filtered.filter(m => !m.lastSignInAt);
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
    console.error('Get members error:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro interno do servidor', status: 500 },
      { status: 500 }
    );
  }
}
