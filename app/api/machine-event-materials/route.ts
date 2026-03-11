import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import MachineEventMaterial from '@/server/models/MachineEventMaterial';
import MachineEvent from '@/server/models/MachineEvent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/machine-event-materials
//   ?machine_id=M1&open_event_type_id=RC
//   → latest record for machine_id where machine_event_type_id = open_event_type_id,
//     actual_open_qty > 0, actual_close_qty = 0  (T303 check)
export async function GET(request: NextRequest) {
  try {
    await ensureConnection();
    const { searchParams } = new URL(request.url);
    const machineId       = searchParams.get('machine_id');
    const openEventTypeId = searchParams.get('open_event_type_id');
    const machineEventId  = searchParams.get('machine_event_id');

    // Simple lookup by machine_event_id
    if (machineEventId) {
      const records = await MachineEventMaterial.find({ machine_event_id: Number(machineEventId) }).lean();
      return NextResponse.json(records);
    }

    // T303 check: find latest open material record for this machine
    if (machineId && openEventTypeId) {
      // Get all machine events for this machine with the open event type
      const openEvents = await MachineEvent.find({
        machine_id: machineId.toUpperCase(),
        machine_event_type_id: openEventTypeId.toUpperCase(),
      }).lean().sort({ machine_event_id: -1 });

      if (!openEvents.length) {
        return NextResponse.json({ error: 'T303', message: 'No open material record found for this machine. {T303}' }, { status: 404 });
      }

      const openEventIds = openEvents.map((e: any) => e.machine_event_id);

      // Find latest MachineEventMaterial with actual_open_qty > 0 and actual_close_qty = 0
      const record = await MachineEventMaterial.findOne({
        machine_id: machineId.toUpperCase(),
        machine_event_id: { $in: openEventIds },
        actual_open_qty: { $gt: 0 },
        $or: [{ actual_close_qty: 0 }, { actual_close_qty: null }, { actual_close_qty: { $exists: false } }],
      }).lean().sort({ machine_event_id: -1 });

      if (!record) {
        return NextResponse.json({ error: 'T303', message: 'No open material record found (open qty > 0, close qty = 0). {T303}' }, { status: 404 });
      }

      return NextResponse.json(record);
    }

    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  } catch (error: any) {
    console.error('GET /machine-event-materials error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch machine event materials' }, { status: 500 });
  }
}
