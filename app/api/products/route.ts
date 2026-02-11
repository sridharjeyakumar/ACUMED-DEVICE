import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductMaster from '@/server/models/ProductMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/products - Get all products
export async function GET() {
  try {
    await ensureConnection();
    // Use lean() for faster queries
    const products = await ProductMaster.find().lean().sort({ product_id: 1 });
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    
    const product = new ProductMaster({ 
      ...body,
      weight_per_piece: body.weight_per_piece ? Number(body.weight_per_piece) : undefined,
      wipes_per_kg: body.wipes_per_kg ? Number(body.wipes_per_kg) : undefined,
      shelf_life_in_months: body.shelf_life_in_months ? Number(body.shelf_life_in_months) : undefined,
      safety_stock_qty: body.safety_stock_qty ? Number(body.safety_stock_qty) : undefined,
      qc_required: body.qc_required === true || body.qc_required === "true",
      sterilization_required: body.sterilization_required === true || body.sterilization_required === "true",
      active: body.active !== undefined ? body.active : true,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await product.save();
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Product ID already exists' },
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
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}








