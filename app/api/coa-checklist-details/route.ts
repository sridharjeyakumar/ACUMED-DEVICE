import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import COAChecklistDetailMaster from '@/server/models/COAChecklistDetailMaster';
import { safeInteger } from '@/utils/numberUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/coa-checklist-details - Get all COA checklist details
export async function GET() {
  try {
    await ensureConnection();
    
    // Fetch all checklist details
    const checklistDetails = await COAChecklistDetailMaster.find().lean().sort({ checklist_id: 1, checklist_sno: 1 });
    
    return NextResponse.json(checklistDetails, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching COA checklist details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    const errorMessage = error.message || 'Failed to fetch COA checklist details';
    const isDbError = error.message?.includes('Database') || 
                     error.message?.includes('MongoDB') || 
                     error.message?.includes('connection') ||
                     error.message?.includes('environment variable');
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: isDbError ? 'Database connection issue. Please check your Database environment variable.' : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/coa-checklist-details - Create new COA checklist detail
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    const checklistDetail = new COAChecklistDetailMaster({ 
      ...body,
      checklist_sno: safeInteger(body.checklist_sno) || 1,
      active: body.active !== undefined ? body.active : true,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await checklistDetail.save();
    return NextResponse.json(checklistDetail, { status: 201 });
  } catch (error: any) {
    console.error('Error creating COA checklist detail:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'COA Checklist Detail already exists (checklist_id + checklist_sno combination)' },
        { status: 400 }
      );
    }
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create COA checklist detail' },
      { status: 500 }
    );
  }
}

// PUT /api/coa-checklist-details - Update COA checklist detail by composite key
export async function PUT(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    
    // Update by composite key (checklist_id + checklist_sno)
    if (body.checklistId && body.checklistSno !== undefined) {
      const updateData: any = {};
      if (body.checklist_parameter !== undefined) updateData.checklist_parameter = body.checklist_parameter;
      if (body.expected_result !== undefined) updateData.expected_result = body.expected_result;
      if (body.active !== undefined) updateData.active = body.active !== false;
      updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
      updateData.last_modified_date_time = new Date();
      
      const checklistDetail = await COAChecklistDetailMaster.findOneAndUpdate(
        { checklist_id: body.checklistId, checklist_sno: safeInteger(body.checklistSno) || 1 },
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();
      
      if (!checklistDetail) {
        return NextResponse.json({ error: 'COA checklist detail not found' }, { status: 404 });
      }
      return NextResponse.json(checklistDetail);
    }
    
    return NextResponse.json({ error: 'checklistId and checklistSno are required' }, { status: 400 });
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

// DELETE /api/coa-checklist-details - Delete all COA checklist details
export async function DELETE(request: NextRequest) {
  try {
    await ensureConnection();
    
    // Delete all documents
    const result = await COAChecklistDetailMaster.deleteMany({});
    
    return NextResponse.json({ 
      message: `Successfully deleted ${result.deletedCount} COA checklist detail records`,
      deletedCount: result.deletedCount
    });
  } catch (error: any) {
    console.error('Error deleting COA checklist details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete COA checklist details' },
      { status: 500 }
    );
  }
}

