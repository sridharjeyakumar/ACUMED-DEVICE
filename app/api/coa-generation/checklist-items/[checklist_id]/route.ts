import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import COAChecklistDetailMaster from '@/server/models/COAChecklistDetailMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// GET /api/coa-generation/checklist-items/[checklist_id]
// Returns checklist detail items for a given checklist_id (no duplicate batch check)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ checklist_id: string }> }
) {
  try {
    const { checklist_id } = await params;
    await ensureConnection();
    const items = await COAChecklistDetailMaster
      .find({ checklist_id })
      .lean()
      .sort({ checklist_sno: 1 });
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch checklist items' }, { status: 500 });
  }
}
