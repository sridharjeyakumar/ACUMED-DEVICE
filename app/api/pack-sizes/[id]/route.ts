import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import PackSizeMaster from '@/server/models/PackSizeMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function ensureDbConnection() {
  try {
    await ensureConnection();
  } catch (error: any) {
    console.error('Database connection error:', error);
    throw new Error('Database connection failed');
  }
}

// GET /api/pack-sizes/[id] - Get pack size by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Pack Size ID is required' }, { status: 400 });
    }
    
    await ensureDbConnection();
    const packSize = await PackSizeMaster.findOne({ pack_size_id: id }).lean();
    if (!packSize) {
      return NextResponse.json({ error: 'Pack Size not found' }, { status: 404 });
    }
    return NextResponse.json(packSize);
  } catch (error: any) {
    console.error('Error fetching pack size:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch pack size',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// PUT /api/pack-sizes/[id] - Update pack size
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Pack Size ID is required' }, { status: 400 });
    }
    
    await ensureDbConnection();
    const body = await request.json();
    
    // Helper function to convert empty strings to undefined
    const cleanValue = (value: any) => (value === '' || value === null) ? undefined : value;
    
    const updateData: any = {};
    
    // Only include fields that are provided (not undefined)
    if (body.pack_size_name !== undefined) updateData.pack_size_name = body.pack_size_name;
    if (body.pack_size_short_name !== undefined) updateData.pack_size_short_name = body.pack_size_short_name;
    if (body.qty_per_carton !== undefined) updateData.qty_per_carton = body.qty_per_carton ? Number(body.qty_per_carton) : undefined;
    if (body.uom !== undefined) updateData.uom = body.uom;
    if (body.active !== undefined) updateData.active = body.active !== false;
    
    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();
    
    const packSize = await PackSizeMaster.findOneAndUpdate(
      { pack_size_id: id },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();
    
    if (!packSize) {
      return NextResponse.json({ error: 'Pack Size not found' }, { status: 404 });
    }
    
    return NextResponse.json(packSize);
  } catch (error: any) {
    console.error('Error updating pack size:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update pack size',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE /api/pack-sizes/[id] - Delete pack size
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Pack Size ID is required' }, { status: 400 });
    }
    
    await ensureDbConnection();
    const packSize = await PackSizeMaster.findOneAndDelete({ pack_size_id: id });
    
    if (!packSize) {
      return NextResponse.json({ error: 'Pack Size not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Pack Size deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting pack size:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to delete pack size',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}








