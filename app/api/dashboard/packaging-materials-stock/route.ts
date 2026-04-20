import { NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import MaterialStocks from '@/server/models/MaterialStocks';
import MaterialMaster from '@/server/models/MaterialMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureConnection();

    const stocks = await MaterialStocks.find({ current_stock_qty: { $gt: 0 } }).lean();

    if (stocks.length === 0) {
      return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });
    }

    const materialIds = stocks.map(s => s.material_id);

    const masters = await MaterialMaster.find({
      material_id:   { $in: materialIds },
      material_type: 'PM',
    })
      .select('material_id material_short_name material_image_icon safety_stock_qty re_order_qty')
      .sort({ material_id: 1 })
      .lean();

    const stockMap = new Map(stocks.map(s => [s.material_id, s]));

    const result = masters.map(m => {
      const s = stockMap.get(m.material_id)!;
      const current = s.current_stock_qty;
      const safety  = m.safety_stock_qty ?? 0;
      const reorder = m.re_order_qty     ?? 0;

      let stock_status: 'CRITICAL' | 'LOW' | null = null;
      if (current < safety)       stock_status = 'CRITICAL';
      else if (current < reorder) stock_status = 'LOW';

      return {
        material_id:         m.material_id,
        material_short_name: m.material_short_name,
        material_image_icon: m.material_image_icon ?? null,
        current_stock_qty:   current,
        uom:                 s.uom,
        total_no_of_rolls:   s.total_no_of_rolls,
        safety_stock_qty:    safety,
        re_order_qty:        reorder,
        stock_status,
      };
    });

    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    console.error('Error fetching packaging materials stock:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch packaging materials stock' },
      { status: 500 }
    );
  }
}
