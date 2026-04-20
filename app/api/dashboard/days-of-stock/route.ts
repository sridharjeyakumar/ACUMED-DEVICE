import { NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import TransactionTable from '@/server/models/TransactionTable';
import ProductBOMMaster from '@/server/models/ProductBOMMaster';
import MaterialStocks from '@/server/models/MaterialStocks';
import MaterialMaster from '@/server/models/MaterialMaster';
import PurchaseOrderDetail from '@/server/models/PurchaseOrderDetail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureConnection();

    // 1. Active batches
    const batches = await TransactionTable.find({
      current_batch_status_id: { $in: ['P', 'W'] },
    })
      .select('batch_no product_id planned_no_of_working_days planned_total_no_of_sachets')
      .lean();

    if (batches.length === 0) {
      return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });
    }

    const productIds = [...new Set(batches.map(b => b.product_id))];

    // 2. BOM entries for those products (active only, output_qty must exist)
    const bomRows = await ProductBOMMaster.find({
      product_id: { $in: productIds },
      active: true,
      output_qty: { $gt: 0 },
    })
      .select('product_id material_id output_qty output_uom input_qty input_uom')
      .lean();

    if (bomRows.length === 0) {
      return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });
    }

    const materialIds = [...new Set(bomRows.map(b => b.material_id))];

    // 3. Parallel: stocks, masters, PO totals
    const [stocks, masters, poRows] = await Promise.all([
      MaterialStocks.find({ material_id: { $in: materialIds } })
        .select('material_id current_stock_qty uom')
        .lean(),
      MaterialMaster.find({ material_id: { $in: materialIds } })
        .select('material_id material_short_name material_image_icon')
        .lean(),
      PurchaseOrderDetail.aggregate([
        { $match: { material_id: { $in: materialIds }, gr_qty: 0 } },
        {
          $group: {
            _id: '$material_id',
            total_po_qty: { $sum: '$po_qty' },
            uom: { $first: '$uom' },
          },
        },
      ]),
    ]);

    const stockMap  = new Map(stocks.map(s => [s.material_id, s]));
    const masterMap = new Map(masters.map(m => [m.material_id, m]));
    const poMap     = new Map(poRows.map(r => [r._id as string, { qty: r.total_po_qty, uom: r.uom }]));

    // 4. Accumulate required_kgs_per_day per material across all active batches
    const materialRequired = new Map<string, number>();

    for (const batch of batches) {
      const days    = batch.planned_no_of_working_days ?? 0;
      const sachets = batch.planned_total_no_of_sachets ?? 0;
      if (days <= 0 || sachets <= 0) continue;

      const daily_sachets = Math.floor(sachets / days);

      const boms = bomRows.filter(b => b.product_id === batch.product_id);
      for (const bom of boms) {
        if (!bom.output_qty || bom.output_qty <= 0) continue;
        const req = Math.round((daily_sachets / bom.output_qty) * 100) / 100;
        materialRequired.set(
          bom.material_id,
          (materialRequired.get(bom.material_id) ?? 0) + req
        );
      }
    }

    // 5. Build result rows
    const result = Array.from(materialRequired.entries())
      .map(([material_id, required_kgs_per_day]) => {
        const stock  = stockMap.get(material_id);
        const master = masterMap.get(material_id);
        const po     = poMap.get(material_id);

        const current_stock_qty = stock?.current_stock_qty ?? 0;
        const uom               = stock?.uom ?? '';
        const days_of_stock     = required_kgs_per_day > 0
          ? Math.floor(current_stock_qty / required_kgs_per_day)
          : null;

        return {
          material_id,
          material_short_name: master?.material_short_name ?? material_id,
          material_image_icon: master?.material_image_icon ?? null,
          required_kgs_per_day,
          current_stock_qty,
          uom,
          days_of_stock,
          po_qty:  po && po.qty > 0 ? po.qty  : null,
          po_uom:  po && po.qty > 0 ? po.uom  : null,
        };
      })
      .sort((a, b) => (a.days_of_stock ?? 9999) - (b.days_of_stock ?? 9999));

    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    console.error('Error fetching days of stock:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch days of stock' },
      { status: 500 }
    );
  }
}
