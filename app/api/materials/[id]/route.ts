import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import MaterialMaster from '@/server/models/MaterialMaster';

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

// GET /api/materials/[id] - Get material by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Material ID is required' }, { status: 400 });
    }
    
    await ensureDbConnection();
    const material = await MaterialMaster.findOne({ material_id: id }).lean();
    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }
    return NextResponse.json(material);
  } catch (error: any) {
    console.error('Error fetching material:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch material',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// PUT /api/materials/[id] - Update material
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Material ID is required' }, { status: 400 });
    }
    
    await ensureDbConnection();
    const body = await request.json();
    
    // Helper function to convert empty strings to undefined
    const cleanValue = (value: any) => (value === '' || value === null) ? undefined : value;
    
    // Handle "??" values for lead time - convert to null/undefined
    const leadTimeMin = body.lead_time_days_min === "??" || body.lead_time_days_min === "" ? null : body.lead_time_days_min;
    const leadTimeMax = body.lead_time_days_max === "??" || body.lead_time_days_max === "" ? null : body.lead_time_days_max;
    
    const updateData: any = {};
    
    // Only include fields that are provided (not undefined)
    if (body.material_name !== undefined) updateData.material_name = body.material_name;
    if (body.material_short_name !== undefined) updateData.material_short_name = body.material_short_name;
    if (body.uom !== undefined) updateData.uom = body.uom;
    if (body.material_category_id !== undefined) updateData.material_category_id = cleanValue(body.material_category_id);
    if (body.material_type !== undefined) updateData.material_type = body.material_type;
    if (body.material_spec !== undefined) updateData.material_spec = cleanValue(body.material_spec);
    if (body.safety_stock_qty !== undefined) updateData.safety_stock_qty = body.safety_stock_qty ? Number(body.safety_stock_qty) : undefined;
    if (body.re_order_qty !== undefined) updateData.re_order_qty = body.re_order_qty ? Number(body.re_order_qty) : undefined;
    if (body.min_order_qty !== undefined) updateData.min_order_qty = body.min_order_qty ? Number(body.min_order_qty) : undefined;
    if (body.lead_time_days_min !== undefined) updateData.lead_time_days_min = leadTimeMin ? Number(leadTimeMin) : null;
    if (body.lead_time_days_max !== undefined) updateData.lead_time_days_max = leadTimeMax ? Number(leadTimeMax) : null;
    if (body.shelf_life_in_months !== undefined) updateData.shelf_life_in_months = body.shelf_life_in_months ? Number(body.shelf_life_in_months) : undefined;
    if (body.qc_required !== undefined) updateData.qc_required = body.qc_required === true || body.qc_required === "true";
    if (body.coa_checklist_id !== undefined) updateData.coa_checklist_id = cleanValue(body.coa_checklist_id);
    if (body.material_image !== undefined) updateData.material_image = cleanValue(body.material_image);
    if (body.material_image_icon !== undefined) updateData.material_image_icon = cleanValue(body.material_image_icon);
    if (body.active !== undefined) updateData.active = body.active !== false;
    
    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();
    
    const material = await MaterialMaster.findOneAndUpdate(
      { material_id: id },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();
    
    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }
    
    return NextResponse.json(material);
  } catch (error: any) {
    console.error('Error updating material:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update material',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE /api/materials/[id] - Delete material
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Material ID is required' }, { status: 400 });
    }
    
    await ensureDbConnection();
    const material = await MaterialMaster.findOneAndDelete({ material_id: id });
    
    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Material deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting material:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to delete material',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}








