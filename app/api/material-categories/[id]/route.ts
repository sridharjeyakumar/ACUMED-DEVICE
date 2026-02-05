import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import MaterialCategoryMaster from '@/server/models/MaterialCategoryMaster';

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

// GET /api/material-categories/[id] - Get material category by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const category = await MaterialCategoryMaster.findOne({ material_category_id: id });
    if (!category) {
      return NextResponse.json({ error: 'Material category not found' }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Error fetching material category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch material category' },
      { status: 500 }
    );
  }
}

// PUT /api/material-categories/[id] - Update material category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const body = await request.json();
    
    const updateData: any = {};
    if (body.material_category_name !== undefined) updateData.material_category_name = body.material_category_name;
    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();
    
    const category = await MaterialCategoryMaster.findOneAndUpdate(
      { material_category_id: id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!category) {
      return NextResponse.json({ error: 'Material category not found' }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Error updating material category:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update material category' },
      { status: 500 }
    );
  }
}

// DELETE /api/material-categories/[id] - Delete material category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const category = await MaterialCategoryMaster.findOneAndDelete({ material_category_id: id });
    if (!category) {
      return NextResponse.json({ error: 'Material category not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Material category deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting material category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete material category' },
      { status: 500 }
    );
  }
}




