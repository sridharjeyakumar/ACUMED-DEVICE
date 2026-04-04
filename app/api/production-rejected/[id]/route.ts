import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductionRejected from '@/server/models/ProductionRejected';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/production-rejected/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureConnection();
    const record = await ProductionRejected.findById(params.id).lean();
    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch record' }, { status: 500 });
  }
}

// PUT /api/production-rejected/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureConnection();
    const body = await request.json();
    const record = await ProductionRejected.findByIdAndUpdate(
      params.id,
      { ...body, last_modified_date_time: new Date() },
      { new: true, runValidators: true }
    );
    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update record' }, { status: 500 });
  }
}

// DELETE /api/production-rejected/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureConnection();
    const record = await ProductionRejected.findByIdAndDelete(params.id);
    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    return NextResponse.json({ message: 'Record deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete record' }, { status: 500 });
  }
}
