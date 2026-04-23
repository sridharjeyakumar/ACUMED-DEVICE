import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import TransactionTable from '@/server/models/TransactionTable';
import ProductMaster from '@/server/models/ProductMaster';
import COAChecklistDetailMaster from '@/server/models/COAChecklistDetailMaster';
import COAHeader from '@/server/models/COAHeader';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// GET /api/coa-generation/batch-info/[batch_no]
// Returns: product_id, manufactured_date, expiry_date, coa_checklist_id, checklist_items
// Also checks if COA already exists for this batch
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ batch_no: string }> }
) {
  try {
    const { batch_no } = await params;
    await ensureConnection();

    // Get batch transaction
    const tx = await TransactionTable.findOne({ batch_no }).lean();
    if (!tx) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

    // Check if COA already generated for this batch
    const existingCOA = await (COAHeader as any).findOne({ batch_no }).lean();
    if (existingCOA) {
      return NextResponse.json(
        { error: `COA already generated for this Batch ( ${(existingCOA as any).coa_no} )` },
        { status: 409 }
      );
    }

    // Get product info
    const product = await ProductMaster.findOne({ product_id: (tx as any).product_id }).lean();
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const p = product as any;
    const t = tx as any;

    // Calculate expiry date
    const manufacturedDate: Date = t.actual_start_date ? new Date(t.actual_start_date) : new Date();
    let expiryDate: Date | null = null;
    if (p.shelf_life_in_months) {
      expiryDate = new Date(manufacturedDate);
      expiryDate.setMonth(expiryDate.getMonth() + p.shelf_life_in_months);
    }

    // Fetch checklist items for coa_checklist_id
    let checklistItems: any[] = [];
    if (p.coa_checklist_id) {
      checklistItems = await COAChecklistDetailMaster
        .find({ checklist_id: p.coa_checklist_id, active: true })
        .lean()
        .sort({ checklist_sno: 1 });
    }

    return NextResponse.json({
      product_id: t.product_id,
      manufactured_date: manufacturedDate,
      expiry_date: expiryDate,
      coa_checklist_id: p.coa_checklist_id || '',
      checklist_items: checklistItems,
    });
  } catch (error: any) {
    console.error('Error fetching batch info:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch batch info' }, { status: 500 });
  }
}
