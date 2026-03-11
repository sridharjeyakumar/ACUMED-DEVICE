import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import MachineStopReasonMaster from '@/server/models/MachineStopReasonMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/machine-stop-reasons - Get all machine stop reasons
export async function GET() {
  try {
    await ensureConnection();
    const reasons = await MachineStopReasonMaster.find().lean().sort({ seq_no: 1 });
    return NextResponse.json(reasons, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching machine stop reasons:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch machine stop reasons' },
      { status: 500 }
    );
  }
}

// POST /api/machine-stop-reasons - Create new machine stop reason
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    const reason = new MachineStopReasonMaster({
      reason_id: body.reason_id,
      reason_name: body.reason_name,
      remarks: body.remarks || '',
      seq_no: body.seq_no,
      active: body.active !== false,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await reason.save();
    return NextResponse.json(reason, { status: 201 });
  } catch (error: any) {
    console.error('Error creating machine stop reason:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Machine Stop Reason ID already exists' },
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
      { error: error.message || 'Failed to create machine stop reason' },
      { status: 500 }
    );
  }
}
