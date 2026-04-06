import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import COAHeader from '@/server/models/COAHeader';
import COADetail from '@/server/models/COADetail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/coa-generation - Get all COA headers
export async function GET() {
  try {
    await ensureConnection();
    const headers = await COAHeader.find().lean().sort({ entered_date_time: -1 });
    return NextResponse.json(headers);
  } catch (error: any) {
    console.error('Error fetching COA headers:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch COA headers' }, { status: 500 });
  }
}

// POST /api/coa-generation - Create new COA header + details
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    const { details, ...headerData } = body;

    // Generate COA No.: COA/YY/NNN (running sno per year, reset each year)
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const prefix = `COA/${yy}/`;

    // Find max running sno for current year
    const lastRecord = await COAHeader
      .findOne({ coa_no: { $regex: `^COA\\/${yy}\\/` } })
      .sort({ coa_no: -1 })
      .lean();

    let nextSno = 1;
    if (lastRecord) {
      const parts = (lastRecord as any).coa_no.split('/');
      const lastSno = parseInt(parts[2], 10);
      if (!isNaN(lastSno)) nextSno = lastSno + 1;
    }
    const coaNo = `${prefix}${String(nextSno).padStart(3, '0')}`;

    // Build header
    const header = new COAHeader({
      ...headerData,
      coa_no: coaNo,
      coa_date: now,
      entered_date_time: now,
      status: 'E',
    });
    await header.save();

    // Save detail rows
    if (Array.isArray(details) && details.length > 0) {
      const detailDocs = details.map((d: any) => ({
        coa_no: coaNo,
        checklist_sno: d.checklist_sno,
        actual_value: d.actual_value,
        actual_text: d.actual_text,
        actual_result: d.actual_result,
      }));
      await COADetail.insertMany(detailDocs);
    }

    return NextResponse.json({ coa_no: coaNo }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating COA:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'COA No. conflict — please retry' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create COA' }, { status: 500 });
  }
}
