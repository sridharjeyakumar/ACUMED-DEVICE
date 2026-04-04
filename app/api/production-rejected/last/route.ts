import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductionRejected from '@/server/models/ProductionRejected';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/production-rejected/last?year=YY
// Returns the highest product_rejection_id for the given 2-digit year prefix
export async function GET(request: NextRequest) {
  try {
    await ensureConnection();
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year'); // 2-digit year e.g. "26"

    if (!year) {
      return NextResponse.json({ error: 'year parameter required' }, { status: 400 });
    }

    const yearInt = parseInt(year);
    // product_rejection_id format: YY + 00001..99999  e.g. 2600001..2699999
    const minId = yearInt * 100000;
    const maxId = minId + 99999;

    const last = await ProductionRejected.findOne({
      product_rejection_id: { $gte: minId, $lte: maxId },
    })
      .sort({ product_rejection_id: -1 })
      .lean();

    return NextResponse.json(last || null);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch last record' }, { status: 500 });
  }
}
