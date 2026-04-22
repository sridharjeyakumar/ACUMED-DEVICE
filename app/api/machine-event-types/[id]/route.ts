import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import MachineEventTypeMaster from '@/server/models/MachineEventTypeMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

let dbConnected = false;

async function ensureDbConnection() {
  const mongoose = await import('mongoose');
  const readyState = mongoose.default.connection.readyState as number;
  if (readyState === 1) {
    dbConnected = true;
    return;
  }
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (error: any) {
      dbConnected = false;
      console.error('Database connection error:', error);
      throw error;
    }
  } else {
    if (readyState !== 1) {
      dbConnected = false;
      await ensureDbConnection();
    }
  }
}

// GET /api/machine-event-types/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const type = await MachineEventTypeMaster.findOne({ machine_event_type_id: id });
    if (!type) {
      return NextResponse.json({ error: 'Machine event type not found' }, { status: 404 });
    }
    return NextResponse.json(type);
  } catch (error: any) {
    console.error('Error fetching machine event type:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch machine event type' },
      { status: 500 }
    );
  }
}

// PUT /api/machine-event-types/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const body = await request.json();

    const updateData: any = {};
    if (body.machine_event_type_name !== undefined) updateData.machine_event_type_name = body.machine_event_type_name;
    if (body.remarks !== undefined) updateData.remarks = body.remarks || '';
    if (body.seq_no !== undefined) updateData.seq_no = body.seq_no;
    if (body.batch_status_id !== undefined) updateData.batch_status_id = body.batch_status_id || '';
    if (body.prerequisite_machine_event_type_id !== undefined) updateData.prerequisite_machine_event_type_id = body.prerequisite_machine_event_type_id || '';
    if (body.accept_material !== undefined) updateData.accept_material = body.accept_material || '';
    if (body.accept_open_qty !== undefined) updateData.accept_open_qty = body.accept_open_qty || '';
    if (body.accept_close_qty !== undefined) updateData.accept_close_qty = body.accept_close_qty || '';
    if (body.accept_reason !== undefined) updateData.accept_reason = body.accept_reason || '';
    if (body.allow_event_time_edited !== undefined) updateData.allow_event_time_edited = body.allow_event_time_edited || '';
    if (body.active !== undefined) updateData.active = body.active !== false;
    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();

    const type = await MachineEventTypeMaster.findOneAndUpdate(
      { machine_event_type_id: id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!type) {
      return NextResponse.json({ error: 'Machine event type not found' }, { status: 404 });
    }
    return NextResponse.json(type);
  } catch (error: any) {
    console.error('Error updating machine event type:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update machine event type' },
      { status: 500 }
    );
  }
}

// DELETE /api/machine-event-types/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const type = await MachineEventTypeMaster.findOneAndDelete({ machine_event_type_id: id });
    if (!type) {
      return NextResponse.json({ error: 'Machine event type not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Machine event type deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting machine event type:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete machine event type' },
      { status: 500 }
    );
  }
}
