import { NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductStatusMaster from '@/server/models/ProductStatusMaster';
import ProductStatusTransitionMaster from '@/server/models/ProductStatusTransitionMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/packing-derive-status
 *
 * Implements the query:
 *   SELECT T.product_status_id  AS Var_To_Product_Status_id,
 *          S.carton_type_id     AS Var_Carton_Type_id
 *   FROM   ProductStatusTransitionMaster T,
 *          ProductStatusMaster           S
 *   WHERE  S.movement_type       = 'I'
 *   AND    S.prod_status_id      = T.from_product_status_id
 */
export async function GET() {
  try {
    await ensureConnection();

    // Step 1 – ProductStatusMaster rows where movement_type = 'I'
    const statusMasterRows = await ProductStatusMaster.find({ movement_type: 'I' })
      .lean()
      .sort({ seq_no: 1 });

    if (!statusMasterRows.length) {
      return NextResponse.json(
        { error: 'No ProductStatusMaster record found with movement_type = I' },
        { status: 404 }
      );
    }

    // Step 2 – For each "from" status, find its transition
    for (const s of statusMasterRows) {
      const transitions = await ProductStatusTransitionMaster.find({
        from_product_status_id: s.prod_status_id,
      })
        .lean()
        .sort({ seq_no: 1 });

      if (transitions.length > 0) {
        return NextResponse.json({
          product_status_id: transitions[0].product_status_id,  // Var_To_Product_Status_id
          carton_type_id: s.carton_type_id || '',               // Var_Carton_Type_id
        });
      }
    }

    return NextResponse.json(
      { error: 'No matching ProductStatusTransitionMaster record found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('packing-derive-status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to derive packing status' },
      { status: 500 }
    );
  }
}
