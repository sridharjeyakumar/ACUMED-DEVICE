import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import Production from '@/server/models/Production';
import ProductionStock from '@/server/models/ProductionStock';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/productions - Get all production records
export async function GET() {
  try {
    await ensureConnection();
    const records = await Production.find().lean().sort({ production_id: 1, collection_bin_no: 1 });
    return NextResponse.json(records, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching productions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch productions' },
      { status: 500 }
    );
  }
}

// POST /api/productions - Create new production record
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    const record = new Production({
      production_id: body.production_id,
      production_date: body.production_date,
      machine_id: body.machine_id,
      batch_no: body.batch_no,
      product_id: body.product_id,
      collection_bin_no: body.collection_bin_no,
      tare_weight_kgs: body.tare_weight_kgs,
      gross_weight_kgs: body.gross_weight_kgs,
      net_weight_kgs: body.net_weight_kgs,
      calculated_total_qty: body.calculated_total_qty,
      machine_count_qty: body.machine_count_qty,
      remarks: body.remarks || '',
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
      status: body.status || 'A',
    });
    await record.save();

    // Upsert ProductionStock: add this production's weights/qty to the batch total
    await ProductionStock.findOneAndUpdate(
      { batch_no: record.batch_no, product_id: record.product_id },
      {
        $inc: {
          net_weight_kgs: record.net_weight_kgs || 0,
          calculated_total_qty: record.calculated_total_qty || 0,
        },
        $set: {
          last_modified_user_id: body.last_modified_user_id || 'ADMIN',
          last_modified_date_time: new Date(),
          status: body.status || 'W',
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    console.error('Error creating production:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Production ID + Collection Bin No combination already exists' },
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
      { error: error.message || 'Failed to create production' },
      { status: 500 }
    );
  }
}
