import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import CartonCapacityMaster from '@/server/models/CartonCapacityMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/carton-capacities - Get all carton capacities
export async function GET() {
  try {
    await ensureConnection();
    // Use lean() for faster queries
    const cartonCapacities = await CartonCapacityMaster.find().lean().sort({ carton_capacity_id: 1 });
    return NextResponse.json(cartonCapacities, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching carton capacities:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch carton capacities' },
      { status: 500 }
    );
  }
}

// POST /api/carton-capacities - Create new carton capacity
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    const cartonCapacity = new CartonCapacityMaster({ 
      ...body,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await cartonCapacity.save();
    return NextResponse.json(cartonCapacity, { status: 201 });
  } catch (error: any) {
    console.error('Error creating carton capacity:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Carton Capacity ID already exists' },
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
      { error: error.message || 'Failed to create carton capacity' },
      { status: 500 }
    );
  }
}











