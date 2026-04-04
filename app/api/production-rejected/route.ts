import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductionRejected from '@/server/models/ProductionRejected';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/production-rejected?batch_no=xxx
export async function GET(request: NextRequest) {
  try {
    await ensureConnection();
    const { searchParams } = new URL(request.url);
    const batch_no = searchParams.get('batch_no');

    const query = batch_no ? { batch_no: batch_no.toUpperCase() } : {};
    const records = await ProductionRejected.find(query)
      .lean()
      .sort({ product_rejection_id: 1 });

    return NextResponse.json(records);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch production rejected records' },
      { status: 500 }
    );
  }
}

// POST /api/production-rejected
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();

    const record = new ProductionRejected({
      ...body,
      batch_no: body.batch_no?.toUpperCase(),
      product_id: body.product_id?.toUpperCase(),
      machine_id: body.machine_id?.toUpperCase(),
      last_modified_date_time: new Date(),
    });
    await record.save();

    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Record already exists' }, { status: 400 });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e: any) => e.message);
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create production rejected record' },
      { status: 500 }
    );
  }
}
