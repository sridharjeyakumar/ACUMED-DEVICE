import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductionRejected from '@/server/models/ProductionRejected';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// PATCH /api/production-rejected/close-batch/[batchNo]
// Sets status = 'C' on all ProductionRejected records matching batch_no
export async function PATCH(
  _request: NextRequest,
  { params }: { params: { batchNo: string } }
) {
  try {
    await ensureConnection();
    const batchNo = params.batchNo.toUpperCase();

    const result = await ProductionRejected.updateMany(
      { batch_no: batchNo },
      { status: 'C', last_modified_date_time: new Date() }
    );

    return NextResponse.json({
      message: `Closed ${result.modifiedCount} production rejected record(s) for batch ${batchNo}`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to close production rejected records' },
      { status: 500 }
    );
  }
}
