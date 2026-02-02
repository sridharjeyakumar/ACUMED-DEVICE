import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import ProductCategoryMaster from '@/server/models/ProductCategoryMaster';

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

// GET /api/product-categories - Get all product categories
export async function GET() {
  try {
    await ensureDbConnection();
    const categories = await ProductCategoryMaster.find().sort({ product_category_id: 1 });
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('Error fetching product categories:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product categories' },
      { status: 500 }
    );
  }
}

// POST /api/product-categories - Create new product category
export async function POST(request: NextRequest) {
  try {
    await ensureDbConnection();
    const body = await request.json();
    const category = new ProductCategoryMaster({ 
      product_category_id: body.product_category_id,
      product_category_name: body.product_category_name,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await category.save();
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product category:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Product Category ID already exists' },
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
      { error: error.message || 'Failed to create product category' },
      { status: 500 }
    );
  }
}

