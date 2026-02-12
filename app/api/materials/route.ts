import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import MaterialMaster from '@/server/models/MaterialMaster';
import { safeNumber } from '@/utils/numberUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/materials - Get all materials
export async function GET() {
  try {
    await ensureConnection();
    // Use lean() for faster queries
    const materials = await MaterialMaster.find().lean().sort({ material_id: 1 });
    return NextResponse.json(materials, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}

// POST /api/materials - Create new material
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    
    // Handle "??" values for lead time - convert to null
    const leadTimeMin = body.lead_time_days_min === "??" || body.lead_time_days_min === "" ? null : body.lead_time_days_min;
    const leadTimeMax = body.lead_time_days_max === "??" || body.lead_time_days_max === "" ? null : body.lead_time_days_max;
    
    const material = new MaterialMaster({ 
      ...body,
      lead_time_days_min: safeNumber(leadTimeMin) || undefined,
      lead_time_days_max: safeNumber(leadTimeMax) || undefined,
      safety_stock_qty: safeNumber(body.safety_stock_qty) || undefined,
      re_order_qty: safeNumber(body.re_order_qty) || undefined,
      min_order_qty: safeNumber(body.min_order_qty) || undefined,
      shelf_life_in_months: safeNumber(body.shelf_life_in_months) || undefined,
      qc_required: body.qc_required === true || body.qc_required === "true",
      active: body.active !== undefined ? body.active : true,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await material.save();
    return NextResponse.json(material, { status: 201 });
  } catch (error: any) {
    console.error('Error creating material:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Material ID already exists' },
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
      { error: error.message || 'Failed to create material' },
      { status: 500 }
    );
  }
}










