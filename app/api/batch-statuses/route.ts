import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import BatchStatusMaster from '@/server/models/BatchStatusMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/batch-statuses - Get all batch statuses
export async function GET() {
  try {
    await ensureConnection();
    const statuses = await BatchStatusMaster.find().lean().sort({ seq_no: 1 });
    return NextResponse.json(statuses, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching batch statuses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch batch statuses' },
      { status: 500 }
    );
  }
}

// POST /api/batch-statuses - Create new batch status
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    const status = new BatchStatusMaster({
      batch_status_id: body.batch_status_id,
      batch_status_name: body.batch_status_name,
      remarks: body.remarks || '',
      seq_no: body.seq_no,
      active: body.active !== false,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await status.save();
    return NextResponse.json(status, { status: 201 });
  } catch (error: any) {
    console.error('Error creating batch status:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Batch Status ID already exists' },
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
      { error: error.message || 'Failed to create batch status' },
      { status: 500 }
    );
  }
}
