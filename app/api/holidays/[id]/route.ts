import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import HolidaysMaster from '@/server/models/HolidaysMaster';

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

// GET /api/holidays/[id] - Get holiday by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const holiday = await HolidaysMaster.findById(id);
    if (!holiday) {
      return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });
    }
    return NextResponse.json(holiday);
  } catch (error: any) {
    console.error('Error fetching holiday:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch holiday' },
      { status: 500 }
    );
  }
}

// PUT /api/holidays/[id] - Update holiday
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const body = await request.json();
    
    const updateData: any = {};
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.remarks !== undefined) updateData.remarks = body.remarks;
    if (body.year !== undefined) updateData.year = body.year;
    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();
    
    const holiday = await HolidaysMaster.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!holiday) {
      return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });
    }
    return NextResponse.json(holiday);
  } catch (error: any) {
    console.error('Error updating holiday:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Holiday with this date and year already exists' },
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
      { error: error.message || 'Failed to update holiday' },
      { status: 500 }
    );
  }
}

// DELETE /api/holidays/[id] - Delete holiday
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const holiday = await HolidaysMaster.findByIdAndDelete(id);
    if (!holiday) {
      return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Holiday deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting holiday:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete holiday' },
      { status: 500 }
    );
  }
}






