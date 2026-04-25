import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductionPlanStatusHistory from '@/server/models/ProductionPlanStatusHistory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/production-plan-status-history?batch_no=xxx
export async function GET(request: NextRequest) {
  try {
    await ensureConnection();
    const { searchParams } = new URL(request.url);
    const batch_no = searchParams.get('batch_no');

    const query: any = {};
    if (batch_no) query.batch_no = batch_no.toUpperCase();

    const records = await ProductionPlanStatusHistory.find(query)
      .lean()
      .sort({ batch_no: 1, date: 1 });

    return NextResponse.json(records);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch status history' },
      { status: 500 }
    );
  }
}

// POST /api/production-plan-status-history
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    console.log('[StatusHistory] POST body:', body);

    if (!body.batch_no || !body.batch_status_id) {
      return NextResponse.json(
        { error: 'batch_no and batch_status_id are required' },
        { status: 400 }
      );
    }

    const record = new ProductionPlanStatusHistory({
      batch_no: body.batch_no.toUpperCase(),
      batch_status_id: body.batch_status_id,
      date: new Date(),
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });

    await record.save();
    console.log('[StatusHistory] Saved:', record._id);
    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create status history' },
      { status: 500 }
    );
  }
}
