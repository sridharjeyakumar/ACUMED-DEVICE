import { NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import MachineStatus from '@/server/models/MachineStatus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/machine-statuses - Get all machine statuses
export async function GET() {
  try {
    await ensureConnection();
    const statuses = await MachineStatus.find().lean().sort({ machine_id: 1 });
    return NextResponse.json(statuses);
  } catch (error: any) {
    console.error('Error fetching machine statuses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch machine statuses' },
      { status: 500 }
    );
  }
}
