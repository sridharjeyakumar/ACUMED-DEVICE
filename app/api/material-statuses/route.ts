import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import MaterialStatusMaster from '@/server/models/MaterialStatusMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/material-statuses - Get all material statuses
export async function GET() {
  try {
    await ensureConnection();
    // Use lean() for faster queries
    const statuses = await MaterialStatusMaster.find().lean().sort({ seq_no: 1 });
    return NextResponse.json(statuses, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching material statuses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch material statuses' },
      { status: 500 }
    );
  }
}

// POST /api/material-statuses - Create new material status
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    const status = new MaterialStatusMaster({ 
      matl_status_id: body.matl_status_id,
      material_status: body.material_status,
      stock_movement: body.stock_movement || '',
      effect_in_stock: body.effect_in_stock || '',
      seq_no: body.seq_no,
      active: body.active !== false,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await status.save();
    return NextResponse.json(status, { status: 201 });
  } catch (error: any) {
    console.error('Error creating material status:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Material status ID already exists' },
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
      { error: error.message || 'Failed to create material status' },
      { status: 500 }
    );
  }
}
