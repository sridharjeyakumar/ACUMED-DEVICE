import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import PackSizeMaster from '@/server/models/PackSizeMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/pack-sizes - Get all pack sizes
export async function GET() {
  try {
    await ensureConnection();
    const packSizes = await PackSizeMaster.find().lean().sort({ pack_size_id: 1 });
    return NextResponse.json(packSizes, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching pack sizes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pack sizes' },
      { status: 500 }
    );
  }
}

// POST /api/pack-sizes - Create new pack size
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    
    const packSize = new PackSizeMaster({ 
      ...body,
      qty_per_carton: body.qty_per_carton ? Number(body.qty_per_carton) : undefined,
      active: body.active !== undefined ? body.active : true,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await packSize.save();
    return NextResponse.json(packSize, { status: 201 });
  } catch (error: any) {
    console.error('Error creating pack size:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Pack Size ID already exists' },
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
      { error: error.message || 'Failed to create pack size' },
      { status: 500 }
    );
  }
}

