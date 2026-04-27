import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductionStock from '@/server/models/ProductionStock';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await ensureConnection();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const batchNo = searchParams.get('batchNo');
    const query: any = {};
    if (productId) query.product_id = productId;
    if (batchNo) query.batch_no = batchNo;
    const stock = await ProductionStock.find(query).lean();
    return NextResponse.json(stock);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch production stock' },
      { status: 500 }
    );
  }
}

// PATCH /api/production-stock?batchNo=X&productId=Y
// Applies incremental deltas to net_weight_kgs and calculated_total_qty
export async function PATCH(request: NextRequest) {
  try {
    await ensureConnection();
    const { searchParams } = new URL(request.url);
    const batchNo = searchParams.get('batchNo');
    const productId = searchParams.get('productId');
    if (!batchNo || !productId) {
      return NextResponse.json({ error: 'batchNo and productId are required' }, { status: 400 });
    }
    const body = await request.json();
    const result = await ProductionStock.findOneAndUpdate(
      { batch_no: batchNo, product_id: productId },
      {
        $inc: {
          net_weight_kgs: body.net_weight_kgs_delta ?? 0,
          calculated_total_qty: body.calculated_total_qty_delta ?? 0,
        },
      },
      { new: true }
    ).lean();
    if (!result) {
      return NextResponse.json({ error: 'ProductionStock record not found' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update production stock' },
      { status: 500 }
    );
  }
}
