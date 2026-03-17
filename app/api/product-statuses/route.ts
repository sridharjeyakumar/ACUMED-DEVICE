import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductStatusMaster from '@/server/models/ProductStatusMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/product-statuses - Get all product statuses
export async function GET(request: NextRequest) {
  try {
    await ensureConnection();
    
    const { searchParams } = new URL(request.url);
    const movementType = searchParams.get('movementType');
    const active = searchParams.get('active');
    
    let query: any = {};
    if (movementType) {
      query.movement_type = movementType;
    }
    if (active !== null) {
      query.active = active === 'true';
    }
    
    const statuses = await ProductStatusMaster.find(query)
      .lean()
      .sort({ seq_no: 1 });
      
    return NextResponse.json(statuses, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching product statuses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product statuses' },
      { status: 500 }
    );
  }
}

// POST /api/product-statuses - Create new product status
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    
    // Check if status already exists
    const existingStatus = await ProductStatusMaster.findOne({ prod_status_id: body.prod_status_id });
    if (existingStatus) {
      return NextResponse.json(
        { error: 'Product status ID already exists' },
        { status: 400 }
      );
    }
    
    const status = new ProductStatusMaster({
      prod_status_id: body.prod_status_id,
      product_status: body.product_status,
      stock_movement: body.stock_movement || '',
      effect_in_stock: body.effect_in_stock || '',
      movement_type: body.movement_type || '',
      stock_origin: body.stock_origin || '',
      from_prod_status_id: body.from_prod_status_id || '',
      prod_status_icon: body.prod_status_icon || '',
      seq_no: body.seq_no,
      active: body.active !== false,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
      location_id: body.location_id || '',
      carton_type_id: body.carton_type_id || '',
    });
    
    await status.save();
    return NextResponse.json(status, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product status:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Product status ID already exists' },
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
      { error: error.message || 'Failed to create product status' },
      { status: 500 }
    );
  }
}
