import { NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import Production from '@/server/models/Production';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/productions/next-id - Generate next production_id (YY + 5-digit serial)
export async function GET() {
  try {
    await ensureConnection();
    const year = new Date().getFullYear() % 100; // 2-digit year e.g. 26
    const yy = year;
    const rangeMin = yy * 100000;   // e.g. 2600000
    const rangeMax = (yy + 1) * 100000 - 1; // e.g. 2699999

    const last = await Production.findOne({
      production_id: { $gte: rangeMin, $lte: rangeMax },
    })
      .sort({ production_id: -1 })
      .lean();

    const serial = last
      ? (last.production_id % 100000) + 1
      : 1;

    const nextId = rangeMin + serial;
    return NextResponse.json({ production_id: nextId });
  } catch (error: any) {
    console.error('Error generating next production ID:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate production ID' },
      { status: 500 }
    );
  }
}
