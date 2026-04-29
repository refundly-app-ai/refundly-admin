import { NextRequest, NextResponse } from 'next/server';
import { mockMembers, mockActivities } from '@/lib/mock-data';

// TODO: replace with real data source
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const member = mockMembers.find(m => m.id === id);

    if (!member) {
      return NextResponse.json(
        { ok: false, error: 'Membro não encontrado', status: 404 },
        { status: 404 }
      );
    }

    // Get member activities across all orgs
    const activities = mockActivities.filter(a => a.actorId === id);

    // Mock sessions
    const sessions = [
      {
        id: 'sess_1',
        device: 'Chrome on macOS',
        ip: '192.168.1.1',
        location: 'São Paulo, BR',
        lastActive: new Date().toISOString(),
        current: true,
      },
      {
        id: 'sess_2',
        device: 'Safari on iOS',
        ip: '192.168.1.2',
        location: 'São Paulo, BR',
        lastActive: new Date(Date.now() - 3600000).toISOString(),
        current: false,
      },
    ];

    return NextResponse.json({
      ok: true,
      data: {
        member,
        activities: activities.slice(0, 100),
        sessions,
      },
    });
  } catch (error) {
    console.error('Get member error:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro interno do servidor', status: 500 },
      { status: 500 }
    );
  }
}
