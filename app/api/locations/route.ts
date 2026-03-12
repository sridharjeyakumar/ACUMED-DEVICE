import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import LocationMaster from '@/server/models/LocationMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/locations - Get all locations
export async function GET() {
  try {
    await ensureConnection();
    const locations = await LocationMaster.find().lean().sort({ location_id: 1 });
    return NextResponse.json(locations, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

// POST /api/locations - Create new location
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    const location = new LocationMaster({
      location_id: body.location_id,
      location_name: body.location_name,
      location_icon: body.location_icon || undefined,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await location.save();
    return NextResponse.json(location, { status: 201 });
  } catch (error: any) {
    console.error('Error creating location:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Location ID already exists' },
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
      { error: error.message || 'Failed to create location' },
      { status: 500 }
    );
  }
}
