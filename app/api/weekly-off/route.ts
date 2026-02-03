import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import WeeklyOffMaster from '@/server/models/WeeklyOffMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/weekly-off - Get all weekly off records
export async function GET() {
  try {
    await ensureConnection();
    // Use lean() for faster queries
    const weeklyOffs = await WeeklyOffMaster.find().lean().sort({ week_off_id: 1 });
    return NextResponse.json(weeklyOffs, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching weekly off records:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch weekly off records' },
      { status: 500 }
    );
  }
}

// POST /api/weekly-off - Create new weekly off record
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    const weeklyOff = new WeeklyOffMaster({ 
      week_off_id: parseInt(body.week_off_id),
      day_of_week: parseInt(body.day_of_week),
      week_of_month: body.week_of_month ? parseInt(body.week_of_month) : undefined,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await weeklyOff.save();
    return NextResponse.json(weeklyOff, { status: 201 });
  } catch (error: any) {
    console.error('Error creating weekly off record:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Weekly Off ID already exists' },
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
      { error: error.message || 'Failed to create weekly off record' },
      { status: 500 }
    );
  }
}
