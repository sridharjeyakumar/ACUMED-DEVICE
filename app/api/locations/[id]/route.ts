import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import LocationMaster from '@/server/models/LocationMaster';

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

// GET /api/locations/[id] - Get location by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const location = await LocationMaster.findOne({ location_id: id });
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }
    return NextResponse.json(location);
  } catch (error: any) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch location' },
      { status: 500 }
    );
  }
}

// PUT /api/locations/[id] - Update location
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const body = await request.json();

    const updateData: any = {};
    if (body.location_name !== undefined) updateData.location_name = body.location_name;
    if (body.location_icon !== undefined) updateData.location_icon = body.location_icon;
    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();
    updateData.active = body.active !== undefined ? body.active : true;

    const location = await LocationMaster.findOneAndUpdate(
      { location_id: id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }
    return NextResponse.json(location);
  } catch (error: any) {
    console.error('Error updating location:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update location' },
      { status: 500 }
    );
  }
}

// DELETE /api/locations/[id] - Delete location
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const location = await LocationMaster.findOneAndDelete({ location_id: id });
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Location deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete location' },
      { status: 500 }
    );
  }
}
