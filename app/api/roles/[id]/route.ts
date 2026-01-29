import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import RoleMaster from '@/server/models/RoleMaster';

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

// GET /api/roles/[id] - Get role by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const role = await RoleMaster.findOne({ roll_id: id });
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    return NextResponse.json(role);
  } catch (error: any) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch role' },
      { status: 500 }
    );
  }
}

// PUT /api/roles/[id] - Update role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const body = await request.json();
    const { roll_description, remarks, active } = body;
    
    const updateData: any = {};
    if (roll_description !== undefined && roll_description !== null) updateData.roll_description = roll_description;
    if (remarks !== undefined && remarks !== null) updateData.remarks = remarks;
    if (active !== undefined) updateData.active = active !== false;
    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();
    
    const role = await RoleMaster.findOneAndUpdate(
      { roll_id: id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    return NextResponse.json(role);
  } catch (error: any) {
    console.error('Error updating role:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update role' },
      { status: 500 }
    );
  }
}

// DELETE /api/roles/[id] - Delete role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const role = await RoleMaster.findOneAndDelete({ roll_id: id });
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete role' },
      { status: 500 }
    );
  }
}


