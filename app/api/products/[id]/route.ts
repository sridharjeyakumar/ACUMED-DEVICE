import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductMaster from '@/server/models/ProductMaster';
import { safeNumber } from '@/utils/numberUtils';

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

// GET /api/products/[id] - Get product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    
    await ensureDbConnection();
    const product = await ProductMaster.findOne({ product_id: id }).lean();
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch product',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    
    await ensureDbConnection();
    
    const body = await request.json();
    
    // Helper function to convert empty strings to undefined
    const cleanValue = (value: any) => (value === '' || value === null) ? undefined : value;
    
    const updateData: any = {};
    
    // Only include fields that are provided (not undefined)
    if (body.product_name !== undefined) updateData.product_name = body.product_name;
    if (body.product_shortname !== undefined) updateData.product_shortname = body.product_shortname;
    if (body.uom !== undefined) updateData.uom = body.uom;
    if (body.product_category_id !== undefined) updateData.product_category_id = cleanValue(body.product_category_id);
    if (body.product_spec !== undefined) updateData.product_spec = cleanValue(body.product_spec);
    if (body.weight_per_piece !== undefined) updateData.weight_per_piece = safeNumber(body.weight_per_piece) || undefined;
    if (body.weight_uom !== undefined) updateData.weight_uom = cleanValue(body.weight_uom);
    if (body.wipes_per_kg !== undefined) updateData.wipes_per_kg = safeNumber(body.wipes_per_kg) || undefined;
    if (body.shelf_life_in_months !== undefined) updateData.shelf_life_in_months = safeNumber(body.shelf_life_in_months) || undefined;
    if (body.storage_condition !== undefined) updateData.storage_condition = cleanValue(body.storage_condition);
    if (body.safety_stock_qty !== undefined) updateData.safety_stock_qty = safeNumber(body.safety_stock_qty) || undefined;
    if (body.default_pack_size_id !== undefined) updateData.default_pack_size_id = cleanValue(body.default_pack_size_id);
    if (body.batch_no_pattern !== undefined) updateData.batch_no_pattern = cleanValue(body.batch_no_pattern);
    if (body.product_image !== undefined) updateData.product_image = cleanValue(body.product_image);
    if (body.product_image_icon !== undefined) updateData.product_image_icon = cleanValue(body.product_image_icon);
    if (body.qc_required !== undefined) updateData.qc_required = body.qc_required === true || body.qc_required === "true";
    if (body.coa_checklist_id !== undefined) updateData.coa_checklist_id = cleanValue(body.coa_checklist_id);
    if (body.sterilization_required !== undefined) updateData.sterilization_required = body.sterilization_required === true || body.sterilization_required === "true";
    if (body.active !== undefined) updateData.active = body.active !== false;
        if (body.batch_prefix !== undefined) updateData.batch_prefix = cleanValue(body.batch_prefix);
    if (body.running_batch_sno !== undefined) {
      updateData.running_batch_sno = safeNumber(body.running_batch_sno) || undefined;
    }
    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();
    
    const product = await ProductMaster.findOneAndUpdate(
      { product_id: id },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error updating product:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update product',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    
    await ensureDbConnection();
    const product = await ProductMaster.findOneAndDelete({ product_id: id });
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to delete product',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}








