import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import COAHeader from '@/server/models/COAHeader';
import COADetail from '@/server/models/COADetail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// GET /api/coa-generation/[id] - Get COA header + details by coa_no
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureConnection();
    const header = await (COAHeader as any).findOne({ coa_no: id }).lean();
    if (!header) return NextResponse.json({ error: 'COA not found' }, { status: 404 });
    const details = await (COADetail as any).find({ coa_no: id }).lean().sort({ checklist_sno: 1 });
    return NextResponse.json({ header, details });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch COA' }, { status: 500 });
  }
}

// PUT /api/coa-generation/[id] - Update COA (edit or approval)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureConnection();
    const body = await request.json();
    const { details, mode, ...headerData } = body;

    const existing = await (COAHeader as any).findOne({ coa_no: id });
    if (!existing) return NextResponse.json({ error: 'COA not found' }, { status: 404 });
    if (existing.status !== 'E') {
      return NextResponse.json({ error: 'Only Entered (E) records can be modified' }, { status: 400 });
    }

    if (mode === 'approval') {
      if (!headerData.review_by_user_id) {
        return NextResponse.json({ error: 'review_by_user_id is required' }, { status: 400 });
      }
      if (!headerData.review_date_time) {
        return NextResponse.json({ error: 'review_date_time is required' }, { status: 400 });
      }
      const reviewDT = new Date(headerData.review_date_time);
      const enteredDT = new Date(existing.entered_date_time);
      const nowDT = new Date();
      if (reviewDT < enteredDT) {
        return NextResponse.json({ error: 'review_date_time must be >= entered_date_time' }, { status: 400 });
      }
      if (reviewDT > nowDT) {
        return NextResponse.json({ error: 'review_date_time cannot be in the future' }, { status: 400 });
      }
      await (COAHeader as any).updateOne(
        { coa_no: id },
        {
          $set: {
            approval_remarks: headerData.approval_remarks,
            approved_by_user_id: headerData.approved_by_user_id,
            approved_date_time: new Date(),
            review_by_user_id: headerData.review_by_user_id,
            review_date_time: reviewDT,
            status: headerData.status,
          },
        }
      );
    } else {
      await (COAHeader as any).updateOne(
        { coa_no: id },
        {
          $set: {
            remarks: headerData.remarks,
            coa_overall_result: headerData.coa_overall_result,
          },
        }
      );

      if (Array.isArray(details)) {
        await (COADetail as any).deleteMany({ coa_no: id });
        if (details.length > 0) {
          const detailDocs = details.map((d: any) => ({
            coa_no: id,
            checklist_sno: d.checklist_sno,
            actual_value: d.actual_value,
            actual_text: d.actual_text,
            actual_result: d.actual_result,
          }));
          await (COADetail as any).insertMany(detailDocs);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating COA:', error);
    return NextResponse.json({ error: error.message || 'Failed to update COA' }, { status: 500 });
  }
}
