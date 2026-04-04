import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import Packing from '@/server/models/Packing';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

let dbConnected = false;

async function ensureDbConnection() {
  const readyState = mongoose.connection.readyState;
  
  // If already connected, return
  if (readyState === mongoose.ConnectionStates.connected) {
    dbConnected = true;
    return;
  }
  
  // If not connected, try to connect
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
    // If dbConnected is true but connection state is not connected, 
    // reset dbConnected and try again recursively
    dbConnected = false;
    await ensureDbConnection();
  }
}

// Helper function to find record by either _id or packing_id
async function findPackingRecord(id: string) {
  let record = null;
  
  // Check if the ID is a valid MongoDB ObjectId
  if (mongoose.Types.ObjectId.isValid(id)) {
    // Try to find by _id first
    record = await (Packing as any).findById(id);
  }
  
  // If not found by _id or invalid ObjectId, try by packing_id
  if (!record) {
    const packingId = parseInt(id);
    if (!isNaN(packingId)) {
      record = await (Packing as any).findOne({ packing_id: packingId });
    }
  }
  
  return record;
}

// GET /api/packing-entry/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    
    const record = await findPackingRecord(id);
    
    if (!record) {
      return NextResponse.json({ error: 'Packing record not found' }, { status: 404 });
    }
    return NextResponse.json(record);
  } catch (error: any) {
    console.error('Error fetching packing record:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch packing record' },
      { status: 500 }
    );
  }
}

// PUT /api/packing-entry/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const body = await request.json();

    // Find the record first
    const record = await findPackingRecord(id);
    
    if (!record) {
      return NextResponse.json({ error: 'Packing record not found' }, { status: 404 });
    }

    // Build update data - only update allowed fields
    const updateData: any = {};
    if (body.packing_date !== undefined) updateData.packing_date = body.packing_date;
    if (body.batch_no !== undefined) updateData.batch_no = body.batch_no;
    if (body.product_id !== undefined) updateData.product_id = body.product_id;
    if (body.packsize_id !== undefined) updateData.packsize_id = body.packsize_id;
    if (body.no_of_packs !== undefined) updateData.no_of_packs = body.no_of_packs;
    if (body.no_of_sachets !== undefined) updateData.no_of_sachets = body.no_of_sachets;
    if (body.total_machine_time_in_min !== undefined) updateData.total_machine_time_in_min = body.total_machine_time_in_min;
    if (body.product_status_id !== undefined) updateData.product_status_id = body.product_status_id;
    if (body.carton_type_id !== undefined) updateData.carton_type_id = body.carton_type_id;
    if (body.packing_material_id !== undefined) updateData.packing_material_id = body.packing_material_id;
    if (body.remarks !== undefined) updateData.remarks = body.remarks;
    if (body.approval_remarks !== undefined) updateData.approval_remarks = body.approval_remarks;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.approved_by_user_id !== undefined) updateData.approved_by_user_id = body.approved_by_user_id;
    if (body.approved_date_time !== undefined) updateData.approved_date_time = body.approved_date_time;

    const updatedRecord = await (Packing as any).findByIdAndUpdate(
      record._id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    return NextResponse.json(updatedRecord);
  } catch (error: any) {
    console.error('Error updating packing record:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update packing record' },
      { status: 500 }
    );
  }
}

// DELETE /api/packing-entry/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    
    const record = await findPackingRecord(id);
    
    if (!record) {
      return NextResponse.json({ error: 'Packing record not found' }, { status: 404 });
    }

    await (Packing as any).findByIdAndDelete(record._id);
    return NextResponse.json({ message: 'Packing record deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting packing record:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete packing record' },
      { status: 500 }
    );
  }
}