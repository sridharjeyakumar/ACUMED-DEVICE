import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductMaster from '@/server/models/ProductMaster';
import { safeNumber } from '@/utils/numberUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    await ensureConnection();
    // Use lean() for faster queries
    const products = await ProductMaster.find().lean().sort({ product_id: 1 });
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
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
      weight_per_piece: safeNumber(body.weight_per_piece) || undefined,
      wipes_per_kg: safeNumber(body.wipes_per_kg) || undefined,
      shelf_life_in_months: safeNumber(body.shelf_life_in_months) || undefined,
      safety_stock_qty: safeNumber(body.safety_stock_qty) || undefined,
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










