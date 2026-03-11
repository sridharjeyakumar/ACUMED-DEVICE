import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import BatchMaterialSummary from '@/server/models/BatchMaterialSummary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/batch-material-summary?batch_no=xxx&material_id=yyy
export async function GET(request: NextRequest) {
  try {
    await ensureConnection();
    const { searchParams } = new URL(request.url);
    const batchNo    = searchParams.get('batch_no');
    const materialId = searchParams.get('material_id');

    const filter: Record<string, any> = {};
    if (batchNo)    filter.batch_no    = batchNo.toUpperCase();
    if (materialId) filter.material_id = materialId.toUpperCase();

    const records = await BatchMaterialSummary.find(filter).lean().sort({ material_id: 1 });
    return NextResponse.json(records);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch batch material summary' }, { status: 500 });
  }
}
