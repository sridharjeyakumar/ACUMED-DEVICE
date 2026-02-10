import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import COAChecklistDetail from '@/server/models/COAChecklistDetail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// PUT /api/coa-checklist-details/[checklistId]/[sno] - Update COA checklist detail
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ checklistId: string; sno: string }> }
) {
  try {
    await ensureConnection();
    const { checklistId, sno } = await params;
    const body = await request.json();
    const coaChecklistDetail = await COAChecklistDetail.findOneAndUpdate(
      { checklist_id: checklistId, checklist_sno: Number(sno) },
      {
        ...body,
        checklist_sno: body.checklist_sno ? Number(body.checklist_sno) : undefined,
        last_modified_user_id: body.last_modified_user_id || 'ADMIN',
        last_modified_date_time: new Date(),
      },
      { new: true, runValidators: true }
    );
    if (!coaChecklistDetail) {
      return NextResponse.json(
        { error: 'COA checklist detail not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(coaChecklistDetail);
  } catch (error: any) {
    console.error('Error updating COA checklist detail:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update COA checklist detail' },
      { status: 500 }
    );
  }
}

// DELETE /api/coa-checklist-details/[checklistId]/[sno] - Delete COA checklist detail
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ checklistId: string; sno: string }> }
) {
  try {
    await ensureConnection();
    const { checklistId, sno } = await params;
    const coaChecklistDetail = await COAChecklistDetail.findOneAndDelete({ 
      checklist_id: checklistId, 
      checklist_sno: Number(sno) 
    });
    if (!coaChecklistDetail) {
      return NextResponse.json(
        { error: 'COA checklist detail not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: 'COA checklist detail deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting COA checklist detail:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete COA checklist detail' },
      { status: 500 }
    );
  }
}

