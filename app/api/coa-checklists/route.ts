import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import COAChecklistMaster from '@/server/models/COAChecklistMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/coa-checklists - Get all COA checklists
export async function GET() {
  try {
    await ensureConnection();
    // Use lean() for faster queries
    const coaChecklists = await COAChecklistMaster.find().lean().sort({ checklist_id: 1 });
    return NextResponse.json(coaChecklists, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching COA checklists:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch COA checklists' },
      { status: 500 }
    );
  }
}

// POST /api/coa-checklists - Create new COA checklist
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    const coaChecklist = new COAChecklistMaster({ 
      ...body,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await coaChecklist.save();
    return NextResponse.json(coaChecklist, { status: 201 });
  } catch (error: any) {
    console.error('Error creating COA checklist:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'COA checklist ID already exists' },
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
      { error: error.message || 'Failed to create COA checklist' },
      { status: 500 }
    );
  }
}

