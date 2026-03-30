import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductStatusTransitionMaster from '@/server/models/ProductStatusTransitionMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/product-status-transitions - Get all transitions
export async function GET(request: NextRequest) {
  try {
    await ensureConnection();
    
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const fromStatus = searchParams.get('fromStatus');
    const toStatus = searchParams.get('toStatus');
    
    let query: any = {};
    
    if (active !== null) {
      query.active = active === 'true';
    }
    
    if (fromStatus) {
      query.from_product_status_id = fromStatus;
    }
    
    if (toStatus) {
      query.product_status_id = toStatus;
    }
    
    const transitions = await ProductStatusTransitionMaster.find(query)
      .lean()
      .sort({ from_product_status_id: 1, product_status_id: 1, seq_no: 1 });
    
    return NextResponse.json(transitions, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching product status transitions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product status transitions' },
      { status: 500 }
    );
  }
}

// POST /api/product-status-transitions - Create new transition
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    
    // Check if transition already exists
    const existingTransition = await ProductStatusTransitionMaster.findOne({
      from_product_status_id: body.from_product_status_id,
      product_status_id: body.product_status_id,
    });
    
    if (existingTransition) {
      return NextResponse.json(
        { error: 'Transition from this status to the selected status already exists' },
        { status: 400 }
      );
    }
    
    const transition = new ProductStatusTransitionMaster({
      product_status_id: body.product_status_id,
      from_product_status_id: body.from_product_status_id,
      sterilization_required: body.sterilization_required || 'N',
      approval_required: body.approval_required || 'N',
      seq_no: body.seq_no,
      no_of_days_min: body.no_of_days_min !== undefined ? Number(body.no_of_days_min) : undefined,
      no_of_days_max: body.no_of_days_max !== undefined ? Number(body.no_of_days_max) : undefined,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
      active: body.active !== undefined ? body.active : true,
    });
    
    await transition.save();
    return NextResponse.json(transition, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product status transition:', error);
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
      { error: error.message || 'Failed to create product status transition' },
      { status: 500 }
    );
  }
}