import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import COAChecklistMaster from '@/server/models/COAChecklistMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/coa-checklists/[id] - Get COA checklist by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureConnection();
    const coaChecklist = await COAChecklistMaster.findOne({ checklist_id: params.id }).lean();
    if (!coaChecklist) {
      return NextResponse.json(
        { error: 'COA checklist not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(coaChecklist);
  } catch (error: any) {
    console.error('Error fetching COA checklist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch COA checklist' },
      { status: 500 }
    );
  }
}

// PUT /api/coa-checklists/[id] - Update COA checklist
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureConnection();
    const body = await request.json();
    const coaChecklist = await COAChecklistMaster.findOneAndUpdate(
      { checklist_id: params.id },
      {
        ...body,
        last_modified_user_id: body.last_modified_user_id || 'ADMIN',
        last_modified_date_time: new Date(),
      },
      { new: true, runValidators: true }
    );
    if (!coaChecklist) {
      return NextResponse.json(
        { error: 'COA checklist not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(coaChecklist);
  } catch (error: any) {
    console.error('Error updating COA checklist:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update COA checklist' },
      { status: 500 }
    );
  }
}

// DELETE /api/coa-checklists/[id] - Delete COA checklist
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureConnection();
    const coaChecklist = await COAChecklistMaster.findOneAndDelete({ checklist_id: params.id });
    if (!coaChecklist) {
      return NextResponse.json(
        { error: 'COA checklist not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: 'COA checklist deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting COA checklist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete COA checklist' },
      { status: 500 }
    );
  }
}

