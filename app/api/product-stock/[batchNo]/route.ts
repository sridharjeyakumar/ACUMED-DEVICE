import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductStock from '@/server/models/ProductStock';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// GET /api/product-stock/[batchNo] - Get stock by batch number
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ batchNo: string }> }
) {
  try {
    const { batchNo } = await params;
    await ensureConnection();
    
    const stock = await ProductStock.findOne({ batch_no: batchNo }).lean();

    return NextResponse.json(stock ?? null);
  } catch (error: any) {
    console.error('Error fetching product stock:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product stock' },
      { status: 500 }
    );
  }
}

// PUT /api/product-stock/[batchNo] - Update stock
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ batchNo: string }> }
) {
  try {
    const { batchNo } = await params;
    await ensureConnection();
    const body = await request.json();
    
    const updateData: any = {};
    if (body.product_id !== undefined) updateData.product_id = body.product_id;
    if (body.pack_size_id !== undefined) updateData.pack_size_id = body.pack_size_id;
    if (body.product_status_id !== undefined) updateData.product_status_id = body.product_status_id;
    if (body.total_no_of_packs !== undefined) updateData.total_no_of_packs = body.total_no_of_packs;
    if (body.total_no_of_sachets !== undefined) updateData.total_no_of_sachets = body.total_no_of_sachets;
    if (body.carton_type_id !== undefined) updateData.carton_type_id = body.carton_type_id;
    if (body.total_no_of_cartons !== undefined) updateData.total_no_of_cartons = body.total_no_of_cartons;
    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();
    
    const stock = await ProductStock.findOneAndUpdate(
      { batch_no: batchNo },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!stock) {
      return NextResponse.json(
        { error: 'Product stock not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(stock);
  } catch (error: any) {
    console.error('Error updating product stock:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update product stock' },
      { status: 500 }
    );
  }
}

// DELETE /api/product-stock/[batchNo] - Delete stock
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ batchNo: string }> }
) {
  try {
    const { batchNo } = await params;
    await ensureConnection();
    
    const stock = await ProductStock.findOneAndDelete({ batch_no: batchNo });
    
    if (!stock) {
      return NextResponse.json(
        { error: 'Product stock not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Product stock deleted successfully',
      deletedBatch: batchNo 
    });
  } catch (error: any) {
    console.error('Error deleting product stock:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product stock' },
      { status: 500 }
    );
  }
}

// PATCH /api/product-stock/[batchNo] - Adjust (upsert) stock by composite key
// Body: { pack_size_id, product_status_id, packs_delta, sachets_delta,
//         cartons_delta?, product_id?, carton_type_id?, last_modified_user_id? }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ batchNo: string }> }
) {
  try {
    const { batchNo } = await params;
    await ensureConnection();
    const body = await request.json();

    const now = new Date();

    const incObj: Record<string, number> = {
      total_no_of_packs:   body.packs_delta   ?? 0,
      total_no_of_sachets: body.sachets_delta  ?? 0,
    };
    if (body.cartons_delta !== undefined) {
      incObj.total_no_of_cartons = body.cartons_delta;
    }

    // Upsert by composite key: batch_no + pack_size_id + product_status_id
    const stock = await ProductStock.findOneAndUpdate(
      { batch_no: batchNo, pack_size_id: body.pack_size_id, product_status_id: body.product_status_id },
      {
        $inc: incObj,
        $set: {
          last_modified_user_id:   body.last_modified_user_id || 'ADMIN',
          last_modified_date_time: now,
        },
        $setOnInsert: {
          batch_no:          batchNo,
          product_id:        body.product_id       || '',
          pack_size_id:      body.pack_size_id,
          product_status_id: body.product_status_id,
          carton_type_id:    body.carton_type_id   || '',
        },
      },
      { new: true, upsert: true }
    );

    return NextResponse.json(stock);
  } catch (error: any) {
    console.error('Error adjusting product stock:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to adjust product stock' },
      { status: 500 }
    );
  }
}