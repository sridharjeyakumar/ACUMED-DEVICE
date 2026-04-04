import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import MachineStatus from '@/server/models/MachineStatus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/machine-statuses/[id] - Get machine status by machine_id
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureConnection();
    const record = await MachineStatus.findOne({ machine_id: params.id.toUpperCase() }).lean();
    if (!record) return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch machine status' }, { status: 500 });
  }
}
