// app/api/production-plan-details/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductionPlanDetail from '@/server/models/ProductionPlanDetails';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/production-plan-details - Get all production plan details
export async function GET(request: NextRequest) {
  try {
    await ensureConnection();
    const { searchParams } = new URL(request.url);
    const batch_no = searchParams.get('batch_no');
    
    let query = {};
    if (batch_no) {
      query = { batch_no: batch_no.toUpperCase() };
    }
    
    const details = await ProductionPlanDetail.find(query)
      .lean()
      .sort({ batch_no: 1, sno: 1 });
    
    return NextResponse.json(details);
  } catch (error: any) {
    console.error('Error fetching production plan details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch production plan details' },
      { status: 500 }
    );
  }
}

// POST /api/production-plan-details - Create new production plan detail
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    
    // Validate required fields
    if (!body.batch_no || !body.sno || !body.product_id || !body.packsize_id || !body.no_of_packs) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate max lengths
    if (body.batch_no && body.batch_no.length > 6) {
      return NextResponse.json(
        { error: 'Batch number must not exceed 6 characters' },
        { status: 400 }
      );
    }

    if (body.remarks && body.remarks.length > 100) {
      return NextResponse.json(
        { error: 'Remarks must not exceed 100 characters' },
        { status: 400 }
      );
    }

    const detailData = {
      ...body,
      batch_no: body.batch_no.toUpperCase(),
      product_id: body.product_id.toUpperCase(),
      no_of_packs: Number(body.no_of_packs),
      no_of_sachets: body.no_of_sachets ? Number(body.no_of_sachets) : undefined,
      packs_per_steri_carton: body.packs_per_steri_carton ? Number(body.packs_per_steri_carton) : undefined,
      no_of_sterilization_cartons: body.no_of_sterilization_cartons ? Number(body.no_of_sterilization_cartons) : undefined,
      packs_per_shipper_carton: body.packs_per_shipper_carton ? Number(body.packs_per_shipper_carton) : undefined,
      no_of_shipper_cartons: body.no_of_shipper_cartons ? Number(body.no_of_shipper_cartons) : undefined,
      last_modified_date_time: new Date(),
    };

    const detail = new ProductionPlanDetail(detailData);
    await detail.save();
    
    return NextResponse.json(detail, { status: 201 });
  } catch (error: any) {
    console.error('Error creating production plan detail:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Production plan detail with this batch and sno already exists' },
        { status: 400 }
      );
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create production plan detail' },
      { status: 500 }
    );
  }
}