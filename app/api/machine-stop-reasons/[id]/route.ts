import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import MachineStopReasonMaster from '@/server/models/MachineStopReasonMaster';

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

// GET /api/machine-stop-reasons/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const reason = await MachineStopReasonMaster.findOne({ reason_id: id });
    if (!reason) {
      return NextResponse.json({ error: 'Machine stop reason not found' }, { status: 404 });
    }
    return NextResponse.json(reason);
  } catch (error: any) {
    console.error('Error fetching machine stop reason:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch machine stop reason' },
      { status: 500 }
    );
  }
}

// PUT /api/machine-stop-reasons/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const body = await request.json();

    const updateData: any = {};
    if (body.reason_name !== undefined) updateData.reason_name = body.reason_name;
    if (body.remarks !== undefined) updateData.remarks = body.remarks || '';
    if (body.seq_no !== undefined) updateData.seq_no = body.seq_no;
    if (body.active !== undefined) updateData.active = body.active !== false;
    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();

    const reason = await MachineStopReasonMaster.findOneAndUpdate(
      { reason_id: id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!reason) {
      return NextResponse.json({ error: 'Machine stop reason not found' }, { status: 404 });
    }
    return NextResponse.json(reason);
  } catch (error: any) {
    console.error('Error updating machine stop reason:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update machine stop reason' },
      { status: 500 }
    );
  }
}

// DELETE /api/machine-stop-reasons/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const reason = await MachineStopReasonMaster.findOneAndDelete({ reason_id: id });
    if (!reason) {
      return NextResponse.json({ error: 'Machine stop reason not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Machine stop reason deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting machine stop reason:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete machine stop reason' },
      { status: 500 }
    );
  }
}
