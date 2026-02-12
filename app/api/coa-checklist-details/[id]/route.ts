import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import COAChecklistDetailMaster from '@/server/models/COAChecklistDetailMaster';
import { safeInteger } from '@/utils/numberUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// GET /api/coa-checklist-details/[id] - Get COA checklist detail by MongoDB _id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureConnection();
    const checklistDetail = await COAChecklistDetailMaster.findById(id).lean();
    if (!checklistDetail) {
      return NextResponse.json({ error: 'COA checklist detail not found' }, { status: 404 });
    }
    return NextResponse.json(checklistDetail);
  } catch (error: any) {
    console.error('Error fetching COA checklist detail:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch COA checklist detail' },
      { status: 500 }
    );
  }
}

// PUT /api/coa-checklist-details/[id] - Update COA checklist detail by MongoDB _id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureConnection();
    const body = await request.json();
    
    const updateData: any = { ...body };
    if (body.checklist_sno !== undefined) updateData.checklist_sno = safeInteger(body.checklist_sno) || 1;
    if (body.active !== undefined) updateData.active = body.active !== false;
    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();
    
    const checklistDetail = await COAChecklistDetailMaster.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();
    
    if (!checklistDetail) {
      return NextResponse.json({ error: 'COA checklist detail not found' }, { status: 404 });
    }
    return NextResponse.json(checklistDetail);
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

// DELETE /api/coa-checklist-details/[id] - Delete COA checklist detail by MongoDB _id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureConnection();
    const checklistDetail = await COAChecklistDetailMaster.findByIdAndDelete(id);
    if (!checklistDetail) {
      return NextResponse.json({ error: 'COA checklist detail not found' }, { status: 404 });
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




