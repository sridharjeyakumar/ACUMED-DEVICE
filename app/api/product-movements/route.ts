import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductMovement from '@/server/models/ProductMovement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/product-movements - Get all product movements
export async function GET(request: NextRequest) {
  try {
    await ensureConnection();
    
    const { searchParams } = new URL(request.url);
    const batchNo = searchParams.get('batchNo');
    const status = searchParams.get('status');
    const year = searchParams.get('year');
    
    let query: any = {};
    if (batchNo) query.batch_no = batchNo;
    if (status) query.status = status;
    
    let movements = await ProductMovement.find(query)
      .lean()
      .sort({ prod_movement_id: -1 });
    
    // Filter by year if specified (for ID generation)
    if (year) {
      const startOfYear = new Date(parseInt(year), 0, 1);
      const endOfYear = new Date(parseInt(year), 11, 31, 23, 59, 59);
      movements = movements.filter(m => {
        const date = new Date(m.movement_date);
        return date >= startOfYear && date <= endOfYear;
      });
    }
    
    return NextResponse.json(movements, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching product movements:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product movements' },
      { status: 500 }
    );
  }
}

// POST /api/product-movements - Create new product movement
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    
    const movement = new ProductMovement({
      prod_movement_id: body.prod_movement_id,
      movement_date: body.movement_date,
      batch_no: body.batch_no,
      product_id: body.product_id,
      pack_size_id: body.pack_size_id,
      to_prod_status_id: body.to_prod_status_id,
      from_prod_status_id: body.from_prod_status_id,
      carton_type_id: body.carton_type_id || '',
      carton_capacity_id: body.carton_capacity_id || '',
      no_of_cartons: body.no_of_cartons || 0,
      no_of_packs: body.no_of_packs,
      no_of_sachets: body.no_of_sachets,
      no_of_the_cartons: body.no_of_the_cartons || 0,
      from_no_of_cartons: body.from_no_of_cartons || 0,
      packing_material_id: body.packing_material_id || '',
      remarks: body.remarks || '',
      entered_by_user_id: body.entered_by_user_id,
      entered_date_time: body.entered_date_time,
      approval_remarks: body.approval_remarks || '',
      approved_by_user_id: body.approved_by_user_id || '',
      approved_date_time: body.approved_date_time || null,
      status: body.status || 'E',
      movement_type: body.movement_type || 'NORMAL',
    });
    
    await movement.save();
    return NextResponse.json(movement, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product movement:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Product movement ID already exists' },
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
      { error: error.message || 'Failed to create product movement' },
      { status: 500 }
    );
  }
}