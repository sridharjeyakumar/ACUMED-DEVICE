import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import BatchStatusMaster from '@/server/models/BatchStatusMaster';

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

// GET /api/batch-statuses/[id] - Get batch status by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const status = await BatchStatusMaster.findOne({ batch_status_id: id });
    if (!status) {
      return NextResponse.json({ error: 'Batch status not found' }, { status: 404 });
    }
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Error fetching batch status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch batch status' },
      { status: 500 }
    );
  }
}

// PUT /api/batch-statuses/[id] - Update batch status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const body = await request.json();

    const updateData: any = {};
    if (body.batch_status_name !== undefined) updateData.batch_status_name = body.batch_status_name;
    if (body.remarks !== undefined) updateData.remarks = body.remarks || '';
    if (body.seq_no !== undefined) updateData.seq_no = body.seq_no;
    if (body.status_seq_no !== undefined) updateData.status_seq_no = body.status_seq_no;
    if (body.machine_event_allowed !== undefined) updateData.machine_event_allowed = body.machine_event_allowed;
    if (body.active !== undefined) updateData.active = body.active !== false;
    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();

    const status = await BatchStatusMaster.findOneAndUpdate(
      { batch_status_id: id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!status) {
      return NextResponse.json({ error: 'Batch status not found' }, { status: 404 });
    }
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Error updating batch status:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update batch status' },
      { status: 500 }
    );
  }
}

// DELETE /api/batch-statuses/[id] - Delete batch status
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const status = await BatchStatusMaster.findOneAndDelete({ batch_status_id: id });
    if (!status) {
      return NextResponse.json({ error: 'Batch status not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Batch status deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting batch status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete batch status' },
      { status: 500 }
    );
  }
}
