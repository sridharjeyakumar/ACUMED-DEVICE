import { NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductStock from '@/server/models/ProductStock';
import Production from '@/server/models/Production';
import ProductMaster from '@/server/models/ProductMaster';
import ProductStatusMaster from '@/server/models/ProductStatusMaster';
import PackSizeMaster from '@/server/models/PackSizeMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureConnection();

    // 1. All stock rows with packs in stock
    const stockRows = await ProductStock.find({ total_no_of_packs: { $gt: 0 } }).lean();

    if (stockRows.length === 0) {
      return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });
    }

    const batchNos   = [...new Set(stockRows.map(s => s.batch_no))];
    const productIds = [...new Set(stockRows.map(s => s.product_id))];
    const packSizeIds = [...new Set(stockRows.map(s => s.pack_size_id))];
    const statusIds  = [...new Set(stockRows.map(s => s.product_status_id))];

    // 2. Parallel lookups
    const [productionAgg, products, statuses, packSizes] = await Promise.all([
      // All-time manufactured totals per batch+product
      Production.aggregate([
        { $match: { batch_no: { $in: batchNos } } },
        {
          $group: {
            _id: { batch_no: '$batch_no', product_id: '$product_id' },
            manufactured_kgs:     { $sum: '$net_weight_kgs' },
            manufactured_sachets: { $sum: '$calculated_total_qty' },
          },
        },
      ]),
      ProductMaster.find({ product_id: { $in: productIds } })
        .select('product_id product_shortname product_image_icon')
        .lean(),
      ProductStatusMaster.find({ prod_status_id: { $in: statusIds } })
        .select('prod_status_id product_status seq_no')
        .lean(),
      PackSizeMaster.find({ pack_size_id: { $in: packSizeIds } })
        .select('pack_size_id pack_size_short_name')
        .lean(),
    ]);

    // 3. Build lookup maps
    const productionMap = new Map(
      productionAgg.map(r => [
        `${r._id.batch_no}|${r._id.product_id}`,
        { manufactured_kgs: r.manufactured_kgs, manufactured_sachets: r.manufactured_sachets },
      ])
    );
    const productMap   = new Map(products.map(p => [p.product_id, p]));
    const statusMap    = new Map(statuses.map(s => [s.prod_status_id, s]));
    const packSizeMap  = new Map(packSizes.map(p => [p.pack_size_id, p]));

    // 4. Group stock rows by batch_no
    const batchMap = new Map<string, typeof stockRows>();
    for (const row of stockRows) {
      if (!batchMap.has(row.batch_no)) batchMap.set(row.batch_no, []);
      batchMap.get(row.batch_no)!.push(row);
    }

    // 5. Build result — one entry per batch
    const result = Array.from(batchMap.entries()).map(([batch_no, rows]) => {
      const product_id  = rows[0].product_id;
      const product     = productMap.get(product_id);
      const prodData    = productionMap.get(`${batch_no}|${product_id}`);

      const manufactured_sachets = prodData?.manufactured_sachets ?? 0;
      const manufactured_kgs     = prodData?.manufactured_kgs     ?? 0;

      // Stock rows with total_no_of_cartons > 0, ordered by seq_no
      const stock_rows = rows
        .filter(r => r.total_no_of_cartons > 0)
        .map(r => {
          const status   = statusMap.get(r.product_status_id);
          const packSize = packSizeMap.get(r.pack_size_id);
          const packs_per_carton =
            r.total_no_of_cartons > 0
              ? Math.floor(r.total_no_of_packs / r.total_no_of_cartons)
              : 0;
          return {
            product_status:     status?.product_status    ?? r.product_status_id,
            seq_no:             status?.seq_no            ?? 99,
            total_no_of_cartons: r.total_no_of_cartons,
            pack_size_short_name: packSize?.pack_size_short_name ?? r.pack_size_id,
            packs_per_carton,
            total_no_of_packs:   r.total_no_of_packs,
            total_no_of_sachets: r.total_no_of_sachets,
          };
        })
        .sort((a, b) => a.seq_no - b.seq_no);

      const stock_sachets = stock_rows.reduce((s, r) => s + r.total_no_of_sachets, 0);
      const total_sachets = manufactured_sachets + stock_sachets;

      return {
        batch_no,
        product_id,
        product_shortname:  product?.product_shortname  ?? product_id,
        product_image_icon: product?.product_image_icon ?? null,
        total_sachets,
        manufactured: { kgs: manufactured_kgs, sachets: manufactured_sachets },
        stock_rows,
      };
    });

    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    console.error('Error fetching stock by stage:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stock by stage' },
      { status: 500 }
    );
  }
}
