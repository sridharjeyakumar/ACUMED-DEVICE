import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductStatusTransitionMaster from '@/server/models/ProductStatusTransitionMaster';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// GET /api/product-status-transitions/[id] - Get transition by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureConnection();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid transition ID format' },
        { status: 400 }
      );
    }
    
    const transition = await ProductStatusTransitionMaster.findById(id).lean();
    
    if (!transition) {
      return NextResponse.json(
        { error: 'Product status transition not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(transition);
  } catch (error: any) {
    console.error('Error fetching product status transition:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product status transition' },
      { status: 500 }
    );
  }
}

// PUT /api/product-status-transitions/[id] - Update transition
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureConnection();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid transition ID format' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Check if trying to update to a duplicate transition
    if (body.from_product_status_id && body.product_status_id) {
      const existingTransition = await ProductStatusTransitionMaster.findOne({
        from_product_status_id: body.from_product_status_id,
        product_status_id: body.product_status_id,
        _id: { $ne: id }
      });
      
      if (existingTransition) {
        return NextResponse.json(
          { error: 'Transition from this status to the selected status already exists' },
          { status: 400 }
        );
      }
    }
    
    const updateData: any = {};
    if (body.sterilization_required !== undefined) updateData.sterilization_required = body.sterilization_required;
    if (body.approval_required !== undefined) updateData.approval_required = body.approval_required;
    if (body.seq_no !== undefined) updateData.seq_no = body.seq_no;
    if (body.lock_qty_change !== undefined) updateData.lock_qty_change = body.lock_qty_change;
    if (body.no_of_days_min !== undefined) updateData.no_of_days_min = body.no_of_days_min !== null && body.no_of_days_min !== '' ? Number(body.no_of_days_min) : undefined;
    if (body.no_of_days_max !== undefined) updateData.no_of_days_max = body.no_of_days_max !== null && body.no_of_days_max !== '' ? Number(body.no_of_days_max) : undefined;
    if (body.active !== undefined) updateData.active = body.active;
    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();
    
    const transition = await ProductStatusTransitionMaster.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!transition) {
      return NextResponse.json(
        { error: 'Product status transition not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(transition);
  } catch (error: any) {
    console.error('Error updating product status transition:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Transition from this status to the selected status already exists' },
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
      { error: error.message || 'Failed to update product status transition' },
      { status: 500 }
    );
  }
}

// DELETE /api/product-status-transitions/[id] - Delete transition
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureConnection();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid transition ID format' },
        { status: 400 }
      );
    }
    
    const transition = await ProductStatusTransitionMaster.findByIdAndDelete(id);
    
    if (!transition) {
      return NextResponse.json(
        { error: 'Product status transition not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Product status transition deleted successfully',
      deletedId: id 
    });
  } catch (error: any) {
    console.error('Error deleting product status transition:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product status transition' },
      { status: 500 }
    );
  }
}