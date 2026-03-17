import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductStock from '@/server/models/ProductStock';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/product-stock - Get all product stock
export async function GET(request: NextRequest) {
  try {
    await ensureConnection();
    
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const batchNo = searchParams.get('batchNo');
    
    let query: any = {};
    if (productId) query.product_id = productId;
    if (batchNo) query.batch_no = batchNo;
    
    const stock = await ProductStock.find(query).lean().sort({ batch_no: 1 });
    
    return NextResponse.json(stock, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching product stock:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product stock' },
      { status: 500 }
    );
  }
}

// POST /api/product-stock - Create new product stock
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    
    // Check if stock already exists
    const existingStock = await ProductStock.findOne({ batch_no: body.batch_no });
    if (existingStock) {
      return NextResponse.json(
        { error: 'Product stock for this batch already exists' },
        { status: 400 }
      );
    }
    
    const stock = new ProductStock({
      batch_no: body.batch_no,
      product_id: body.product_id,
      pack_size_id: body.pack_size_id,
      product_status_id: body.product_status_id,
      total_no_of_packs: body.total_no_of_packs,
      total_no_of_sachets: body.total_no_of_sachets,
      carton_type_id: body.carton_type_id || '',
      total_no_of_cartons: body.total_no_of_cartons,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    
    await stock.save();
    return NextResponse.json(stock, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product stock:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Product stock for this batch already exists' },
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
      { error: error.message || 'Failed to create product stock' },
      { status: 500 }
    );
  }
}