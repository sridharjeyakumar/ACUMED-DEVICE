import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import ProductStatusMaster from '@/server/models/ProductStatusMaster';

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

// GET /api/product-statuses - Get all product statuses
export async function GET() {
  try {
    await ensureDbConnection();
    const statuses = await ProductStatusMaster.find().sort({ seq_no: 1 });
    return NextResponse.json(statuses);
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
    await ensureDbConnection();
    const body = await request.json();
    const status = new ProductStatusMaster({ 
      prod_status_id: body.prod_status_id,
      product_status: body.product_status,
      stock_movement: body.stock_movement || '',
      effect_in_stock: body.effect_in_stock || '',
      seq_no: body.seq_no,
      active: body.active !== false,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
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
