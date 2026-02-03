import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import CartonTypeMaster from '@/server/models/CartonTypeMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/carton-types - Get all carton types
export async function GET() {
  try {
    await ensureConnection();
    // Use lean() for faster queries
    const cartonTypes = await CartonTypeMaster.find().lean().sort({ carton_type_id: 1 });
    return NextResponse.json(cartonTypes, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching carton types:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch carton types' },
      { status: 500 }
    );
  }
}

// POST /api/carton-types - Create new carton type
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    const cartonType = new CartonTypeMaster({ 
      ...body,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await cartonType.save();
    return NextResponse.json(cartonType, { status: 201 });
  } catch (error: any) {
    console.error('Error creating carton type:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Carton Type ID already exists' },
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
      { error: error.message || 'Failed to create carton type' },
      { status: 500 }
    );
  }
}

