import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import ProductCategoryMaster from '@/server/models/ProductCategoryMaster';

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

// GET /api/product-categories/[id] - Get product category by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const category = await ProductCategoryMaster.findOne({ product_category_id: id });
    if (!category) {
      return NextResponse.json({ error: 'Product category not found' }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Error fetching product category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product category' },
      { status: 500 }
    );
  }
}

// PUT /api/product-categories/[id] - Update product category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const body = await request.json();
    
    const updateData: any = {};
    if (body.product_category_name !== undefined) updateData.product_category_name = body.product_category_name;
    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();
    
    const category = await ProductCategoryMaster.findOneAndUpdate(
      { product_category_id: id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!category) {
      return NextResponse.json({ error: 'Product category not found' }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Error updating product category:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update product category' },
      { status: 500 }
    );
  }
}

// DELETE /api/product-categories/[id] - Delete product category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const category = await ProductCategoryMaster.findOneAndDelete({ product_category_id: id });
    if (!category) {
      return NextResponse.json({ error: 'Product category not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Product category deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product category' },
      { status: 500 }
    );
  }
}






