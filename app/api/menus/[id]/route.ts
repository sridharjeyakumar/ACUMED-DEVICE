import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import MenuMaster from '@/server/models/MenuMaster';

// Force Node.js runtime (required for Mongoose)
export const runtime = 'nodejs';

// Route segment config
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Ensure DB connection
let dbConnected = false;

async function ensureDbConnection() {
  const mongoose = await import('mongoose');
  // Check if already connected (1 = connected)
  const readyState = mongoose.default.connection.readyState as number;
  if (readyState === 1) {
    dbConnected = true;
    return; // Already connected
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
    // Verify connection is still alive
    if (readyState !== 1) {
      dbConnected = false;
      await ensureDbConnection();
    }
  }
}

// GET /api/menus/[id] - Get menu by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const menu = await MenuMaster.findOne({ menu_id: id });
    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }
    return NextResponse.json(menu);
  } catch (error: any) {
    console.error('Error fetching menu:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch menu',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// PUT /api/menus/[id] - Update menu
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const body = await request.json();
    const { menu_desc, active } = body;
    
    const updateData: any = {};
    if (menu_desc !== undefined && menu_desc !== null) updateData.menu_desc = menu_desc;
    if (active !== undefined) updateData.active = active !== false;
    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      );
    }
    
    const menu = await MenuMaster.findOneAndUpdate(
      { menu_id: id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }
    return NextResponse.json(menu);
  } catch (error: any) {
    console.error('Error updating menu:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update menu' },
      { status: 500 }
    );
  }
}

// DELETE /api/menus/[id] - Delete menu
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const menu = await MenuMaster.findOneAndDelete({ menu_id: id });
    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Menu deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting menu:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete menu' },
      { status: 500 }
    );
  }
}


