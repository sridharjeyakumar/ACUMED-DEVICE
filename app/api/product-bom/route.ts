import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductBOMMaster from '@/server/models/ProductBOMMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/product-bom - Get all product BOMs
export async function GET() {
  try {
    await ensureConnection();
    // Use lean() for faster queries
    const productBOMs = await ProductBOMMaster.find().lean().sort({ bom_id: 1, material_id: 1 });
    return NextResponse.json(productBOMs, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching product BOMs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product BOMs' },
      { status: 500 }
    );
  }
}

// POST /api/product-bom - Create new product BOM
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    const productBOM = new ProductBOMMaster({ 
      ...body,
      output_qty: body.output_qty === '' || body.output_qty === null ? null : Number(body.output_qty),
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await productBOM.save();
    return NextResponse.json(productBOM, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product BOM:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Product BOM already exists' },
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
      { error: error.message || 'Failed to create product BOM' },
      { status: 500 }
    );
  }
}




