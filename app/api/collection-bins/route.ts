import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import CollectionBinMaster from '@/server/models/CollectionBinMaster';
import { safeNumber } from '@/utils/numberUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/collection-bins - Get all collection bins
export async function GET() {
  try {
    await ensureConnection();
    const collectionBins = await CollectionBinMaster.find().lean().sort({ bin_id: 1 });
    return NextResponse.json(collectionBins, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching collection bins:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch collection bins' },
      { status: 500 }
    );
  }
}

// POST /api/collection-bins - Create new collection bin
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    const collectionBin = new CollectionBinMaster({ 
      ...body,
      tare_weight_kg: safeNumber(body.tare_weight_kg) || undefined,
      gross_capacity_kg: safeNumber(body.gross_capacity_kg) || undefined,
      active: body.active !== undefined ? body.active : true,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await collectionBin.save();
    return NextResponse.json(collectionBin, { status: 201 });
  } catch (error: any) {
    console.error('Error creating collection bin:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Collection Bin ID already exists' },
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
      { error: error.message || 'Failed to create collection bin' },
      { status: 500 }
    );
  }
}



