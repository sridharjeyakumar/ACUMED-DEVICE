import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import UomMaster from '@/server/models/UomMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/uom - Get all UOMs
export async function GET() {
  try {
    await ensureConnection();
    const uoms = await UomMaster.find().lean().sort({ uom_id: 1 });
    return NextResponse.json(uoms, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching UOMs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch UOMs' },
      { status: 500 }
    );
  }
}

// POST /api/uom - Create new UOM
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    
    // Check if UOM ID already exists
    const existingUOM = await UomMaster.findOne({ uom_id: body.uom_id });
    if (existingUOM) {
      return NextResponse.json(
        { error: 'UOM ID already exists' },
        { status: 400 }
      );
    }

    const uom = new UomMaster(body);
    await uom.save();
    
    return NextResponse.json(uom, { status: 201 });
  } catch (error: any) {
    console.error('Error creating UOM:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create UOM' },
      { status: 500 }
    );
  }
}