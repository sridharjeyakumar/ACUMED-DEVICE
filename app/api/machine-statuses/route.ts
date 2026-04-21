import { NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import MachineStatus from '@/server/models/MachineStatus';
import ProductMachinerMaster from '@/server/models/ProductMachinerMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/machine-statuses - Get all machine statuses for active machines only
export async function GET() {
  try {
    await ensureConnection();
    const activeMachines = await ProductMachinerMaster.find({ active: true }, { machine_id: 1 }).lean();
    const activeMachineIds = activeMachines.map((m) => m.machine_id);
    const statuses = await MachineStatus.find({ machine_id: { $in: activeMachineIds } }).lean().sort({ machine_id: 1 });
    return NextResponse.json(statuses);
  } catch (error: any) {
    console.error('Error fetching machine statuses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch machine statuses' },
      { status: 500 }
    );
  }
}
