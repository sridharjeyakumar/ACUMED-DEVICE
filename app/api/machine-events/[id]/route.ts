import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import MachineEvent from '@/server/models/MachineEvent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/machine-events/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureConnection();
    const event = await MachineEvent.findOne({ machine_event_id: Number(params.id) }).lean();
    if (!event) {
      return NextResponse.json({ error: 'Machine Event not found' }, { status: 404 });
    }
    return NextResponse.json(event);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch machine event' },
      { status: 500 }
    );
  }
}

// PUT /api/machine-events/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureConnection();
    const body = await request.json();
    const event = await MachineEvent.findOneAndUpdate(
      { machine_event_id: Number(params.id) },
      { ...body, last_modified_date_time: new Date() },
      { new: true, runValidators: true }
    );
    if (!event) {
      return NextResponse.json({ error: 'Machine Event not found' }, { status: 404 });
    }
    return NextResponse.json(event);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update machine event' },
      { status: 500 }
    );
  }
}

// DELETE /api/machine-events/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureConnection();
    const event = await MachineEvent.findOneAndDelete({ machine_event_id: Number(params.id) });
    if (!event) {
      return NextResponse.json({ error: 'Machine Event not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Machine Event deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete machine event' },
      { status: 500 }
    );
  }
}
