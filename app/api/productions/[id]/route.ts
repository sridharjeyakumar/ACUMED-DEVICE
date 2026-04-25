// import { NextRequest, NextResponse } from 'next/server';
// import connectDB from '@/server/db/connection';
// import Production from '@/server/models/Production';

// export const runtime = 'nodejs';
// export const dynamic = 'force-dynamic';
// export const dynamicParams = true;

// let dbConnected = false;

// async function ensureDbConnection() {
//   const mongoose = await import('mongoose');
//   const readyState = mongoose.default.connection.readyState as number;
//   if (readyState === 1) {
//     dbConnected = true;
//     return;
//   }
//   if (!dbConnected) {
//     try {
//       await connectDB();
//       dbConnected = true;
//     } catch (error: any) {
//       dbConnected = false;
//       console.error('Database connection error:', error);
//       throw error;
//     }
//   } else {
//     if (readyState !== 1) {
//       dbConnected = false;
//       await ensureDbConnection();
//     }
//   }
// }

// // GET /api/productions/[id]
// export async function GET(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const { id } = await params;
//     await ensureDbConnection();
//     const record = await Production.findById(id);
//     if (!record) {
//       return NextResponse.json({ error: 'Production record not found' }, { status: 404 });
//     }
//     return NextResponse.json(record);
//   } catch (error: any) {
//     console.error('Error fetching production:', error);
//     return NextResponse.json(
//       { error: error.message || 'Failed to fetch production' },
//       { status: 500 }
//     );
//   }
// }

// // PUT /api/productions/[id]
// export async function PUT(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const { id } = await params;
//     await ensureDbConnection();
//     const body = await request.json();

//     const updateData: any = {};
//     if (body.production_id !== undefined) updateData.production_id = body.production_id;
//     if (body.production_date !== undefined) updateData.production_date = body.production_date;
//     if (body.machine_id !== undefined) updateData.machine_id = body.machine_id;
//     if (body.batch_no !== undefined) updateData.batch_no = body.batch_no;
//     if (body.product_id !== undefined) updateData.product_id = body.product_id;
//     if (body.collection_bin_no !== undefined) updateData.collection_bin_no = body.collection_bin_no;
//     if (body.tare_weight_kgs !== undefined) updateData.tare_weight_kgs = body.tare_weight_kgs;
//     if (body.gross_weight_kgs !== undefined) updateData.gross_weight_kgs = body.gross_weight_kgs;
//     if (body.net_weight_kgs !== undefined) updateData.net_weight_kgs = body.net_weight_kgs;
//     if (body.calculated_total_qty !== undefined) updateData.calculated_total_qty = body.calculated_total_qty;
//     if (body.machine_count_qty !== undefined) updateData.machine_count_qty = body.machine_count_qty;
//     if (body.remarks !== undefined) updateData.remarks = body.remarks || '';
//     if (body.status !== undefined) updateData.status = body.status;
//     updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
//     updateData.last_modified_date_time = new Date();

//     const record = await Production.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
//     if (!record) {
//       return NextResponse.json({ error: 'Production record not found' }, { status: 404 });
//     }
//     return NextResponse.json(record);
//   } catch (error: any) {
//     console.error('Error updating production:', error);
//     if (error.name === 'ValidationError') {
//       return NextResponse.json(
//         { error: 'Validation failed', details: error.message },
//         { status: 400 }
//       );
//     }
//     return NextResponse.json(
//       { error: error.message || 'Failed to update production' },
//       { status: 500 }
//     );
//   }
// }

// // DELETE /api/productions/[id]
// export async function DELETE(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const { id } = await params;
//     await ensureDbConnection();
//     const record = await Production.findByIdAndDelete(id);
//     if (!record) {
//       return NextResponse.json({ error: 'Production record not found' }, { status: 404 });
//     }
//     return NextResponse.json({ message: 'Production record deleted successfully' });
//   } catch (error: any) {
//     console.error('Error deleting production:', error);
//     return NextResponse.json(
//       { error: error.message || 'Failed to delete production' },
//       { status: 500 }
//     );
//   }
// }
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import Production from '@/server/models/Production';
import ProductionStock from '@/server/models/ProductionStock';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

let dbConnected = false;

async function ensureDbConnection() {
  const mongoose = await import('mongoose');
  const readyState = mongoose.default.connection.readyState as number;
  if (readyState === 1) {
    dbConnected = true;
    return;
  }
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (error: any) {
      dbConnected = false;
      console.error('Database connection error:', error);
      throw error;
    }
  } else {
    if (readyState !== 1) {
      dbConnected = false;
      await ensureDbConnection();
    }
  }
}

// GET /api/productions/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const record = await Production.findById(id);
    if (!record) {
      return NextResponse.json({ error: 'Production record not found' }, { status: 404 });
    }
    return NextResponse.json(record);
  } catch (error: any) {
    console.error('Error fetching production:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch production' },
      { status: 500 }
    );
  }
}

// PUT /api/productions/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const body = await request.json();

    // Extract old values sent from frontend for diff calculation
    const oldNetWeight: number = body._old_net_weight_kgs ?? 0;
    const oldCalcQty: number = body._old_calculated_total_qty ?? 0;

    const updateData: any = {};
    if (body.production_id !== undefined) updateData.production_id = body.production_id;
    if (body.production_date !== undefined) updateData.production_date = body.production_date;
    if (body.machine_id !== undefined) updateData.machine_id = body.machine_id;
    if (body.batch_no !== undefined) updateData.batch_no = body.batch_no;
    if (body.product_id !== undefined) updateData.product_id = body.product_id;
    if (body.collection_bin_no !== undefined) updateData.collection_bin_no = body.collection_bin_no;
    if (body.tare_weight_kgs !== undefined) updateData.tare_weight_kgs = body.tare_weight_kgs;
    if (body.gross_weight_kgs !== undefined) updateData.gross_weight_kgs = body.gross_weight_kgs;
    if (body.net_weight_kgs !== undefined) updateData.net_weight_kgs = body.net_weight_kgs;
    if (body.calculated_total_qty !== undefined) updateData.calculated_total_qty = body.calculated_total_qty;
    if (body.machine_count_qty !== undefined) updateData.machine_count_qty = body.machine_count_qty;
    if (body.remarks !== undefined) updateData.remarks = body.remarks || '';
    if (body.status !== undefined) updateData.status = body.status;
    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();

    const record = await Production.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!record) {
      return NextResponse.json({ error: 'Production record not found' }, { status: 404 });
    }

    // Sync ProductionStock only if weight/qty fields were part of this update
    const isWeightUpdate = body.net_weight_kgs !== undefined || body.calculated_total_qty !== undefined;
    if (isWeightUpdate) {
      const netWeightDiff = (record.net_weight_kgs || 0) - oldNetWeight;
      const calcQtyDiff = (record.calculated_total_qty || 0) - oldCalcQty;

      if (netWeightDiff !== 0 || calcQtyDiff !== 0) {
        await ProductionStock.findOneAndUpdate(
          { batch_no: record.batch_no, product_id: record.product_id },
          {
            $inc: {
              net_weight_kgs: netWeightDiff,
              calculated_total_qty: calcQtyDiff,
            },
            $set: {
              last_modified_user_id: body.last_modified_user_id || 'ADMIN',
              last_modified_date_time: new Date(),
              status: body.status || record.status,
            },
          },
          { upsert: true, new: true }
        );
      }
    }

    return NextResponse.json(record);
  } catch (error: any) {
    console.error('Error updating production:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update production' },
      { status: 500 }
    );
  }
}

// DELETE /api/productions/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();

    // Fetch before deleting so we have the values to subtract from ProductionStock
    const record = await Production.findById(id);
    if (!record) {
      return NextResponse.json({ error: 'Production record not found' }, { status: 404 });
    }

    await Production.findByIdAndDelete(id);

    // Subtract this record's contribution from ProductionStock
    const netWeight = record.net_weight_kgs || 0;
    const calcQty = record.calculated_total_qty || 0;

    if (netWeight !== 0 || calcQty !== 0) {
      await ProductionStock.findOneAndUpdate(
        { batch_no: record.batch_no, product_id: record.product_id },
        {
          $inc: {
            net_weight_kgs: -netWeight,
            calculated_total_qty: -calcQty,
          },
          $set: {
            last_modified_user_id: 'ADMIN',
            last_modified_date_time: new Date(),
          },
        }
        // No upsert here — if stock doc doesn't exist, nothing to subtract
      );
    }

    return NextResponse.json({ message: 'Production record deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting production:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete production' },
      { status: 500 }
    );
  }
}