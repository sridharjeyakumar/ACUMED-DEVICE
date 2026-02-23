import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import UomMaster from '@/server/models/UomMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/uom/[id] - Get specific UOM
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureConnection();
    const uom = await UomMaster.findOne({ uom_id: params.id }).lean();
    
    if (!uom) {
      return NextResponse.json(
        { error: 'UOM not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(uom);
  } catch (error: any) {
    console.error('Error fetching UOM:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch UOM' },
      { status: 500 }
    );
  }
}

// PUT /api/uom/[id] - Update UOM
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureConnection();
    const body = await request.json();
    
    const uom = await UomMaster.findOneAndUpdate(
      { uom_id: params.id },
      { ...body, last_modified_date_time: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!uom) {
      return NextResponse.json(
        { error: 'UOM not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(uom);
  } catch (error: any) {
    console.error('Error updating UOM:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update UOM' },
      { status: 500 }
    );
  }
}

// DELETE /api/uom/[id] - Delete UOM
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureConnection();
    const uom = await UomMaster.findOneAndDelete({ uom_id: params.id });
    
    if (!uom) {
      return NextResponse.json(
        { error: 'UOM not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'UOM deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting UOM:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete UOM' },
      { status: 500 }
    );
  }
}