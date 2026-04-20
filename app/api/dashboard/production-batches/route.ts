import { NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import TransactionTable from '@/server/models/TransactionTable';
import ProductMaster from '@/server/models/ProductMaster';
import Production from '@/server/models/Production';
import ProductionRejected from '@/server/models/ProductionRejected';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureConnection();

    const batches = await TransactionTable.find({
      current_batch_status_id: { $in: ['P', 'W'] },
    })
      .select('batch_no product_id planned_start_date actual_start_date planned_no_of_working_days planned_total_no_of_sachets')
      .lean();

    const productIds = [...new Set(batches.map((b) => b.product_id))];
    const products = await ProductMaster.find({ product_id: { $in: productIds } })
      .select('product_id product_name')
      .lean();

    const productMap = new Map(products.map((p) => [p.product_id, p.product_name]));

    // Today's date range (midnight to 23:59:59)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const batchNos = batches.map((b) => b.batch_no);

    // Aggregate today's production grouped by batch_no + product_id (totals)
    const todayAgg = await Production.aggregate([
      {
        $match: {
          production_date: { $gte: todayStart, $lte: todayEnd },
          batch_no: { $in: batchNos },
        },
      },
      {
        $group: {
          _id: { batch_no: '$batch_no', product_id: '$product_id' },
          produced_qty_kgs: { $sum: '$net_weight_kgs' },
          produced_sachets: { $sum: '$calculated_total_qty' },
        },
      },
    ]);

    // Aggregate today's production grouped by batch_no + product_id + machine_id
    const machineAgg = await Production.aggregate([
      {
        $match: {
          production_date: { $gte: todayStart, $lte: todayEnd },
          batch_no: { $in: batchNos },
        },
      },
      {
        $group: {
          _id: { batch_no: '$batch_no', product_id: '$product_id', machine_id: '$machine_id' },
          start_time: { $min: '$last_modified_date_time' },
          produced_qty_kgs: { $sum: '$net_weight_kgs' },
          produced_sachets: { $sum: '$calculated_total_qty' },
        },
      },
      { $sort: { '_id.machine_id': 1 } },
    ]);

    // Key: "batch_no|product_id"
    const prodMap = new Map(
      todayAgg.map((r) => [
        `${r._id.batch_no}|${r._id.product_id}`,
        { produced_qty_kgs: r.produced_qty_kgs, produced_sachets: r.produced_sachets },
      ])
    );

    // Aggregate ALL-TIME production per batch (no date filter) for batch % calculation
    const batchTotalAgg = await Production.aggregate([
      {
        $match: {
          batch_no: { $in: batchNos },
        },
      },
      {
        $group: {
          _id: { batch_no: '$batch_no', product_id: '$product_id' },
          batch_produced_sachets: { $sum: '$calculated_total_qty' },
        },
      },
    ]);

    const batchTotalMap = new Map(
      batchTotalAgg.map((r) => [
        `${r._id.batch_no}|${r._id.product_id}`,
        r.batch_produced_sachets as number,
      ])
    );

    // Aggregate today's rejected qty grouped by batch_no + product_id
    const rejectedAgg = await ProductionRejected.aggregate([
      {
        $match: {
          entry_date: { $gte: todayStart, $lte: todayEnd },
          batch_no: { $in: batchNos },
        },
      },
      {
        $group: {
          _id: { batch_no: '$batch_no', product_id: '$product_id' },
          rejected_qty_kgs: { $sum: '$net_weight_kgs' },
        },
      },
    ]);

    const rejectedMap = new Map(
      rejectedAgg.map((r) => [
        `${r._id.batch_no}|${r._id.product_id}`,
        r.rejected_qty_kgs as number,
      ])
    );

    // Group machine rows by "batch_no|product_id"
    const machineMap = new Map<string, { machine_id: string; start_time: string | null; produced_qty_kgs: number; produced_sachets: number }[]>();
    for (const r of machineAgg) {
      const key = `${r._id.batch_no}|${r._id.product_id}`;
      if (!machineMap.has(key)) machineMap.set(key, []);
      machineMap.get(key)!.push({
        machine_id: r._id.machine_id,
        start_time: r.start_time ? new Date(r.start_time).toISOString() : null,
        produced_qty_kgs: r.produced_qty_kgs,
        produced_sachets: r.produced_sachets,
      });
    }

    const result = batches.map((b) => {
      const planned_daily_sachets =
        b.planned_no_of_working_days && b.planned_total_no_of_sachets
          ? Math.floor(b.planned_total_no_of_sachets / b.planned_no_of_working_days)
          : null;

      const todayData = prodMap.get(`${b.batch_no}|${b.product_id}`);
      const batch_produced_sachets = batchTotalMap.get(`${b.batch_no}|${b.product_id}`) ?? 0;
      const batch_pct =
        b.planned_total_no_of_sachets && b.planned_total_no_of_sachets > 0
          ? Math.floor((batch_produced_sachets / b.planned_total_no_of_sachets) * 100)
          : 0;

      return {
        batch_no: b.batch_no,
        product_id: b.product_id,
        product_name: productMap.get(b.product_id) ?? b.product_id,
        // actual_start_date when production begins, else fall back to planned_start_date
        start_date: b.actual_start_date ?? b.planned_start_date ?? null,
        planned_no_of_working_days: b.planned_no_of_working_days ?? null,
        planned_total_no_of_sachets: b.planned_total_no_of_sachets ?? null,
        planned_daily_sachets,
        produced_qty_kgs: todayData?.produced_qty_kgs ?? 0,
        produced_sachets: todayData?.produced_sachets ?? 0,
        rejected_qty_kgs: rejectedMap.get(`${b.batch_no}|${b.product_id}`) ?? 0,
        batch_produced_sachets,
        batch_pct,
        machines: machineMap.get(`${b.batch_no}|${b.product_id}`) ?? [],
      };
    });

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error: any) {
    console.error('Error fetching production batches:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch production batches' },
      { status: 500 }
    );
  }
}
