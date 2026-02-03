import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import CartonTypeMaster from '@/server/models/CartonTypeMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// GET /api/carton-types/[id] - Get carton type by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureConnection();
    const cartonType = await CartonTypeMaster.findOne({ carton_type_id: id });
    if (!cartonType) {
      return NextResponse.json({ error: 'Carton type not found' }, { status: 404 });
    }
    return NextResponse.json(cartonType);
  } catch (error: any) {
    console.error('Error fetching carton type:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch carton type' },
      { status: 500 }
    );
  }
}

// PUT /api/carton-types/[id] - Update carton type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureConnection();
    const body = await request.json();
    
    const updateData: any = { ...body };
    delete updateData.carton_type_id; // Prevent ID change
    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();
    
    const cartonType = await CartonTypeMaster.findOneAndUpdate(
      { carton_type_id: id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!cartonType) {
      return NextResponse.json({ error: 'Carton type not found' }, { status: 404 });
    }
    return NextResponse.json(cartonType);
  } catch (error: any) {
    console.error('Error updating carton type:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update carton type' },
      { status: 500 }
    );
  }
}

// DELETE /api/carton-types/[id] - Delete carton type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureConnection();
    const cartonType = await CartonTypeMaster.findOneAndDelete({ carton_type_id: id });
    if (!cartonType) {
      return NextResponse.json({ error: 'Carton type not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Carton type deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting carton type:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete carton type' },
      { status: 500 }
    );
  }
}

