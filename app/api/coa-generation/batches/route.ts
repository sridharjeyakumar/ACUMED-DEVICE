import { NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import TransactionTable from '@/server/models/TransactionTable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/coa-generation/batches - Get completed batches (status = 'C')
export async function GET() {
  try {
    await ensureConnection();
    const batches = await TransactionTable
      .find({ current_batch_status_id: 'C', active: true })
      .select('batch_no product_id actual_start_date')
      .lean()
      .sort({ batch_no: 1 });
    return NextResponse.json(batches);
  } catch (error: any) {
    console.error('Error fetching completed batches:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch batches' }, { status: 500 });
  }
}
