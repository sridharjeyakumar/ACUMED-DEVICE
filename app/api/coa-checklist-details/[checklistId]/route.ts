import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import COAChecklistDetail from '@/server/models/COAChecklistDetail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/coa-checklist-details/[checklistId] - Get COA checklist details by checklist ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ checklistId: string }> }
) {
  try {
    await ensureConnection();
    const { checklistId } = await params;
    const coaChecklistDetails = await COAChecklistDetail.find({ checklist_id: checklistId }).lean().sort({ checklist_sno: 1 });
    return NextResponse.json(coaChecklistDetails);
  } catch (error: any) {
    console.error('Error fetching COA checklist details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch COA checklist details' },
      { status: 500 }
    );
  }
}




