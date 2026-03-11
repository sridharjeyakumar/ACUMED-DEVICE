import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import MachineEventTypeMaster from '@/server/models/MachineEventTypeMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/machine-event-types - Get all machine event types
export async function GET() {
  try {
    await ensureConnection();
    const types = await MachineEventTypeMaster.find().lean().sort({ seq_no: 1 });
    return NextResponse.json(types, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching machine event types:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch machine event types' },
      { status: 500 }
    );
  }
}

// POST /api/machine-event-types - Create new machine event type
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    const type = new MachineEventTypeMaster({
      machine_event_type_id: body.machine_event_type_id,
      machine_event_type_name: body.machine_event_type_name,
      remarks: body.remarks || '',
      seq_no: body.seq_no,
      batch_status_id: body.batch_status_id || '',
      prerequisite_machine_event_type_id: body.prerequisite_machine_event_type_id || '',
      accept_material: body.accept_material || '',
      accept_open_qty: body.accept_open_qty || '',
      accept_close_qty: body.accept_close_qty || '',
      accept_reason: body.accept_reason || '',
      active: body.active !== false,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await type.save();
    return NextResponse.json(type, { status: 201 });
  } catch (error: any) {
    console.error('Error creating machine event type:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Machine Event Type ID already exists' },
        { status: 400 }
      );
    }
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create machine event type' },
      { status: 500 }
    );
  }
}
