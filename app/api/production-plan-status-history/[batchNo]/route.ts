import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductionPlanStatusHistory from '@/server/models/ProductionPlanStatusHistory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// GET /api/production-plan-status-history/[batchNo]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ batchNo: string }> }
) {
  try {
    const { batchNo } = await params;
    await ensureConnection();

    const records = await ProductionPlanStatusHistory.find({
      batch_no: batchNo.toUpperCase(),
    })
      .lean()
      .sort({ date: 1 });

    return NextResponse.json(records);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch status history' },
      { status: 500 }
    );
  }
}
