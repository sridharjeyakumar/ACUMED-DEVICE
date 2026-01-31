import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import ProductStatusMaster from '@/server/models/ProductStatusMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

let dbConnected = false;

async function ensureDbConnection() {
  const mongoose = await import('mongoose');
  const readyState = mongoose.default.connection.readyState as number;
  if (readyState === 1) {
    dbConnected = true;
    return;
  }
  
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (error: any) {
      dbConnected = false;
      console.error('Database connection error:', error);
      throw error;
    }
  } else {
    if (readyState !== 1) {
      dbConnected = false;
      await ensureDbConnection();
    }
  }
}

// GET /api/product-statuses/[id] - Get product status by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const status = await ProductStatusMaster.findOne({ prod_status_id: id });
    if (!status) {
      return NextResponse.json({ error: 'Product status not found' }, { status: 404 });
    }
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Error fetching product status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product status' },
      { status: 500 }
    );
  }
}

// PUT /api/product-statuses/[id] - Update product status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const body = await request.json();
    
    const updateData: any = {};
    if (body.product_status !== undefined) updateData.product_status = body.product_status;
    if (body.stock_movement !== undefined) updateData.stock_movement = body.stock_movement || '';
    if (body.effect_in_stock !== undefined) updateData.effect_in_stock = body.effect_in_stock || '';
    if (body.seq_no !== undefined) updateData.seq_no = body.seq_no;
    if (body.active !== undefined) updateData.active = body.active !== false;
    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();
    
    const status = await ProductStatusMaster.findOneAndUpdate(
      { prod_status_id: id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!status) {
      return NextResponse.json({ error: 'Product status not found' }, { status: 404 });
    }
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Error updating product status:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update product status' },
      { status: 500 }
    );
  }
}

// DELETE /api/product-statuses/[id] - Delete product status
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const status = await ProductStatusMaster.findOneAndDelete({ prod_status_id: id });
    if (!status) {
      return NextResponse.json({ error: 'Product status not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Product status deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product status' },
      { status: 500 }
    );
  }
}
