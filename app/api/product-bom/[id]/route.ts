import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductBOMMaster from '@/server/models/ProductBOMMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// GET /api/product-bom/[id] - Get product BOM by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureConnection();
    const productBOM = await ProductBOMMaster.findById(id);
    if (!productBOM) {
      return NextResponse.json({ error: 'Product BOM not found' }, { status: 404 });
    }
    return NextResponse.json(productBOM);
  } catch (error: any) {
    console.error('Error fetching product BOM:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product BOM' },
      { status: 500 }
    );
  }
}

// PUT /api/product-bom/[id] - Update product BOM
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureConnection();
    const body = await request.json();
    
    const updateData: any = { ...body };
    updateData.output_qty = body.output_qty === '' || body.output_qty === null ? null : Number(body.output_qty);
    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();
    
    const productBOM = await ProductBOMMaster.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!productBOM) {
      return NextResponse.json({ error: 'Product BOM not found' }, { status: 404 });
    }
    return NextResponse.json(productBOM);
  } catch (error: any) {
    console.error('Error updating product BOM:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update product BOM' },
      { status: 500 }
    );
  }
}

// DELETE /api/product-bom/[id] - Delete product BOM
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureConnection();
    const productBOM = await ProductBOMMaster.findByIdAndDelete(id);
    if (!productBOM) {
      return NextResponse.json({ error: 'Product BOM not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Product BOM deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product BOM:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product BOM' },
      { status: 500 }
    );
  }
}


