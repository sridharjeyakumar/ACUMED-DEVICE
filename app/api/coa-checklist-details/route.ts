import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import COAChecklistDetail from '@/server/models/COAChecklistDetail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/coa-checklist-details - Get all COA checklist details
export async function GET() {
  try {
    await ensureConnection();
    // Use lean() for faster queries
    const coaChecklistDetails = await COAChecklistDetail.find().lean().sort({ checklist_id: 1, checklist_sno: 1 });
    return NextResponse.json(coaChecklistDetails, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching COA checklist details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch COA checklist details' },
      { status: 500 }
    );
  }
}

// POST /api/coa-checklist-details - Create new COA checklist detail
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    const coaChecklistDetail = new COAChecklistDetail({ 
      ...body,
      checklist_sno: Number(body.checklist_sno),
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await coaChecklistDetail.save();
    return NextResponse.json(coaChecklistDetail, { status: 201 });
  } catch (error: any) {
    console.error('Error creating COA checklist detail:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'COA checklist detail already exists for this checklist ID and serial number' },
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




