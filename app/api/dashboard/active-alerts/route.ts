import { NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import MaterialStocks from '@/server/models/MaterialStocks';
import MaterialMaster from '@/server/models/MaterialMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface AlertItem {
  type: 'critical' | 'warning';
  title: string;
  description: string;
  icon: 'alert' | 'package';
}

export async function GET() {
  try {
    await ensureConnection();

    const stocks = await MaterialStocks.find({ current_stock_qty: { $gt: 0 } }).lean();
    const materialIds = stocks.map(s => s.material_id);

    const masters = await MaterialMaster.find({
      material_id:   { $in: materialIds },
      material_type: { $in: ['RM', 'PM'] },
    })
      .select('material_id material_short_name material_type safety_stock_qty re_order_qty')
      .lean();

    const stockMap = new Map(stocks.map(s => [s.material_id, s]));

    const alerts: AlertItem[] = [];

    for (const m of masters) {
      const s = stockMap.get(m.material_id);
      if (!s) continue;

      const current = s.current_stock_qty;
      const safety  = m.safety_stock_qty ?? 0;
      const reorder = m.re_order_qty     ?? 0;
      const uom     = s.uom ?? '';
      const label   = m.material_type === 'PM' ? 'Packaging' : 'Raw';

      if (current < safety) {
        alerts.push({
          type: 'critical',
          title: `Critical: ${m.material_short_name} Low`,
          description: `${label} material "${m.material_short_name}" stock is critically low at ${current.toFixed(2)} ${uom}. Reorder immediately. Min: ${safety.toLocaleString()} ${uom}.`,
          icon: 'alert',
        });
      } else if (current < reorder) {
        alerts.push({
          type: 'warning',
          title: `Reorder Alert: ${m.material_short_name}`,
          description: `${label} material "${m.material_short_name}" is approaching reorder level. Current: ${current.toFixed(2)} ${uom}. Reorder at: ${reorder.toLocaleString()} ${uom}.`,
          icon: 'package',
        });
      }
    }

    return NextResponse.json(alerts, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    console.error('Error fetching active alerts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch active alerts' },
      { status: 500 }
    );
  }
}
