import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import WeeklyOffMaster from '@/server/models/WeeklyOffMaster';

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

// GET /api/weekly-off/[id] - Get weekly off record by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const weeklyOff = await WeeklyOffMaster.findById(id);
    if (!weeklyOff) {
      return NextResponse.json({ error: 'Weekly off record not found' }, { status: 404 });
    }
    return NextResponse.json(weeklyOff);
  } catch (error: any) {
    console.error('Error fetching weekly off record:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch weekly off record' },
      { status: 500 }
    );
  }
}

// PUT /api/weekly-off/[id] - Update weekly off record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const body = await request.json();
    
    const updateData: any = {};
    if (body.day_of_week !== undefined) updateData.day_of_week = parseInt(body.day_of_week);
    if (body.week_of_month !== undefined) updateData.week_of_month = body.week_of_month ? parseInt(body.week_of_month) : undefined;
    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();
    
    const weeklyOff = await WeeklyOffMaster.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!weeklyOff) {
      return NextResponse.json({ error: 'Weekly off record not found' }, { status: 404 });
    }
    return NextResponse.json(weeklyOff);
  } catch (error: any) {
    console.error('Error updating weekly off record:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update weekly off record' },
      { status: 500 }
    );
  }
}

// DELETE /api/weekly-off/[id] - Delete weekly off record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const weeklyOff = await WeeklyOffMaster.findByIdAndDelete(id);
    if (!weeklyOff) {
      return NextResponse.json({ error: 'Weekly off record not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Weekly off record deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting weekly off record:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete weekly off record' },
      { status: 500 }
    );
  }
}

