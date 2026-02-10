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
    
    // Handle "??" values for lead time - convert to null
    const leadTimeMin = body.lead_time_days_min === "??" || body.lead_time_days_min === "" ? null : body.lead_time_days_min;
    const leadTimeMax = body.lead_time_days_max === "??" || body.lead_time_days_max === "" ? null : body.lead_time_days_max;
    
    const updateData: any = {
      ...body,
      lead_time_days_min: leadTimeMin ? Number(leadTimeMin) : undefined,
      lead_time_days_max: leadTimeMax ? Number(leadTimeMax) : undefined,
      safety_stock_qty: body.safety_stock_qty ? Number(body.safety_stock_qty) : undefined,
      re_order_qty: body.re_order_qty ? Number(body.re_order_qty) : undefined,
      min_order_qty: body.min_order_qty ? Number(body.min_order_qty) : undefined,
      shelf_life_in_months: body.shelf_life_in_months ? Number(body.shelf_life_in_months) : undefined,
      qc_required: body.qc_required === true || body.qc_required === "true",
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    };
    
    // Remove material_id from update data to prevent changing it
    delete updateData.material_id;
    
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







