import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import MaterialStatusMaster from '@/server/models/MaterialStatusMaster';

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

// GET /api/material-statuses/[id] - Get material status by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const status = await MaterialStatusMaster.findOne({ matl_status_id: id });
    if (!status) {
      return NextResponse.json({ error: 'Material status not found' }, { status: 404 });
    }
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Error fetching material status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch material status' },
      { status: 500 }
    );
  }
}

// PUT /api/material-statuses/[id] - Update material status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const body = await request.json();
    
    const updateData: any = {};
    if (body.material_status !== undefined) updateData.material_status = body.material_status;
    if (body.stock_movement !== undefined) updateData.stock_movement = body.stock_movement || '';
    if (body.effect_in_stock !== undefined) updateData.effect_in_stock = body.effect_in_stock || '';
    if (body.seq_no !== undefined) updateData.seq_no = body.seq_no;
    if (body.active !== undefined) updateData.active = body.active !== false;
    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();
    
    const status = await MaterialStatusMaster.findOneAndUpdate(
      { matl_status_id: id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!status) {
      return NextResponse.json({ error: 'Material status not found' }, { status: 404 });
    }
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Error updating material status:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update material status' },
      { status: 500 }
    );
  }
}

// DELETE /api/material-statuses/[id] - Delete material status
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const status = await MaterialStatusMaster.findOneAndDelete({ matl_status_id: id });
    if (!status) {
      return NextResponse.json({ error: 'Material status not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Material status deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting material status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete material status' },
      { status: 500 }
    );
  }
}
















