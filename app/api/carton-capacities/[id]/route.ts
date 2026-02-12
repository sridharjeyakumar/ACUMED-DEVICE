import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import CartonCapacityMaster from '@/server/models/CartonCapacityMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// GET /api/carton-capacities/[id] - Get carton capacity by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureConnection();
    const cartonCapacity = await CartonCapacityMaster.findOne({ carton_capacity_id: id });
    if (!cartonCapacity) {
      return NextResponse.json({ error: 'Carton capacity not found' }, { status: 404 });
    }
    return NextResponse.json(cartonCapacity);
  } catch (error: any) {
    console.error('Error fetching carton capacity:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch carton capacity' },
      { status: 500 }
    );
  }
}

// PUT /api/carton-capacities/[id] - Update carton capacity
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureConnection();
    const body = await request.json();
    
    const updateData: any = { ...body };
    delete updateData.carton_capacity_id; // Prevent ID change
    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();
    
    const cartonCapacity = await CartonCapacityMaster.findOneAndUpdate(
      { carton_capacity_id: id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!cartonCapacity) {
      return NextResponse.json({ error: 'Carton capacity not found' }, { status: 404 });
    }
    return NextResponse.json(cartonCapacity);
  } catch (error: any) {
    console.error('Error updating carton capacity:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update carton capacity' },
      { status: 500 }
    );
  }
}

// DELETE /api/carton-capacities/[id] - Delete carton capacity
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureConnection();
    const cartonCapacity = await CartonCapacityMaster.findOneAndDelete({ carton_capacity_id: id });
    if (!cartonCapacity) {
      return NextResponse.json({ error: 'Carton capacity not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Carton capacity deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting carton capacity:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete carton capacity' },
      { status: 500 }
    );
  }
}










