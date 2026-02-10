import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import CollectionBinMaster from '@/server/models/CollectionBinMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/collection-bins/[id] - Get collection bin by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureConnection();
    const { id } = await params;
    const collectionBin = await CollectionBinMaster.findOne({ bin_id: id }).lean();
    if (!collectionBin) {
      return NextResponse.json(
        { error: 'Collection bin not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(collectionBin);
  } catch (error: any) {
    console.error('Error fetching collection bin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch collection bin' },
      { status: 500 }
    );
  }
}

// PUT /api/collection-bins/[id] - Update collection bin
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureConnection();
    const { id } = await params;
    const body = await request.json();
    const collectionBin = await CollectionBinMaster.findOneAndUpdate(
      { bin_id: id },
      {
        ...body,
        tare_weight_kg: body.tare_weight_kg ? Number(body.tare_weight_kg) : undefined,
        gross_capacity_kg: body.gross_capacity_kg ? Number(body.gross_capacity_kg) : undefined,
        last_modified_user_id: body.last_modified_user_id || 'ADMIN',
        last_modified_date_time: new Date(),
      },
      { new: true, runValidators: true }
    );
    if (!collectionBin) {
      return NextResponse.json(
        { error: 'Collection bin not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(collectionBin);
  } catch (error: any) {
    console.error('Error updating collection bin:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update collection bin' },
      { status: 500 }
    );
  }
}

// DELETE /api/collection-bins/[id] - Delete collection bin
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureConnection();
    const { id } = await params;
    const collectionBin = await CollectionBinMaster.findOneAndDelete({ bin_id: id });
    if (!collectionBin) {
      return NextResponse.json(
        { error: 'Collection bin not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: 'Collection bin deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting collection bin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete collection bin' },
      { status: 500 }
    );
  }
}

