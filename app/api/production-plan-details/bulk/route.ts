// app/api/production-plan-details/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductionPlanDetail from '@/server/models/ProductionPlanDetails';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/production-plan-details/bulk - Create multiple production plan details
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Expected an array of production plan details' },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of body) {
      if (!item.batch_no || !item.sno || !item.product_id || !item.packsize_id || !item.no_of_packs) {
        return NextResponse.json(
          { error: 'Missing required fields in one or more items' },
          { status: 400 }
        );
      }
    }

    // Prepare data for insertion
    const detailsData = body.map(item => ({
      ...item,
      batch_no: item.batch_no.toUpperCase(),
      product_id: item.product_id.toUpperCase(),
      no_of_packs: Number(item.no_of_packs),
      no_of_sachets: item.no_of_sachets ? Number(item.no_of_sachets) : undefined,
      packs_per_steri_carton: item.packs_per_steri_carton ? Number(item.packs_per_steri_carton) : undefined,
      no_of_sterilization_cartons: item.no_of_sterilization_cartons ? Number(item.no_of_sterilization_cartons) : undefined,
      packs_per_shipper_carton: item.packs_per_shipper_carton ? Number(item.packs_per_shipper_carton) : undefined,
      no_of_shipper_cartons: item.no_of_shipper_cartons ? Number(item.no_of_shipper_cartons) : undefined,
      last_modified_user_id: item.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    }));

    // Insert all details
    const details = await ProductionPlanDetail.insertMany(detailsData, { ordered: false });
    
    return NextResponse.json(details, { status: 201 });
  } catch (error: any) {
    console.error('Error creating production plan details:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'One or more production plan details already exist' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create production plan details' },
      { status: 500 }
    );
  }
}