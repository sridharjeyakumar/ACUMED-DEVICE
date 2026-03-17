import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductMovement from '@/server/models/ProductMovement';


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/product-movements/[id] - Get movement by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureConnection();
    
    const movement = await ProductMovement.findOne({ prod_movement_id: parseInt(id) }).lean();
    
    if (!movement) {
      return NextResponse.json(
        { error: 'Product movement not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(movement);
  } catch (error: any) {
    console.error('Error fetching product movement:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product movement' },
      { status: 500 }
    );
  }
}

// PUT /api/product-movements/[id] - Update movement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureConnection();
    const body = await request.json();
    
    const updateData: any = {};
    if (body.movement_date) updateData.movement_date = body.movement_date;
    if (body.to_prod_status_id) updateData.to_prod_status_id = body.to_prod_status_id;
    if (body.from_prod_status_id) updateData.from_prod_status_id = body.from_prod_status_id;
    if (body.carton_type_id !== undefined) updateData.carton_type_id = body.carton_type_id;
    if (body.carton_capacity_id !== undefined) updateData.carton_capacity_id = body.carton_capacity_id;
    if (body.no_of_cartons !== undefined) updateData.no_of_cartons = body.no_of_cartons;
    if (body.no_of_packs !== undefined) updateData.no_of_packs = body.no_of_packs;
    if (body.no_of_sachets !== undefined) updateData.no_of_sachets = body.no_of_sachets;
    if (body.remarks !== undefined) updateData.remarks = body.remarks;
    if (body.approval_remarks !== undefined) updateData.approval_remarks = body.approval_remarks;
    if (body.approved_by_user_id !== undefined) updateData.approved_by_user_id = body.approved_by_user_id;
    if (body.approved_date_time !== undefined) updateData.approved_date_time = body.approved_date_time;
    if (body.status !== undefined) updateData.status = body.status;
    
    const movement = await ProductMovement.findOneAndUpdate(
      { prod_movement_id: parseInt(id) },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!movement) {
      return NextResponse.json(
        { error: 'Product movement not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(movement);
  } catch (error: any) {
    console.error('Error updating product movement:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update product movement' },
      { status: 500 }
    );
  }
}

// DELETE /api/product-movements/[id] - Delete movement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureConnection();
    
    const movement = await ProductMovement.findOneAndDelete({ prod_movement_id: parseInt(id) });
    
    if (!movement) {
      return NextResponse.json(
        { error: 'Product movement not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Product movement deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product movement:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product movement' },
      { status: 500 }
    );
  }
}