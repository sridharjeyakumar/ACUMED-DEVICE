import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import GoodsMovementUnits from '@/server/models/GoodsMovementUnits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        await ensureConnection();
        const { searchParams } = new URL(request.url);
        const gm_no = searchParams.get('gm_no');
        const filter: any = {};
        if (gm_no) filter.gm_no = gm_no.toUpperCase();
        const records = await GoodsMovementUnits.find(filter).lean().sort({ createdAt: 1 });
        return NextResponse.json(records);
    } catch (error: any) {
        console.error('Error fetching goods movement units:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await ensureConnection();
        const body = await request.json();
        const record = new GoodsMovementUnits({
            gm_no:    body.gm_no,
            roll_no:  body.roll_no,
            nett_qty: Number(body.nett_qty),
            uom:      body.uom,
            status:   body.status || 'E',
        });
        await record.save();
        return NextResponse.json(record, { status: 201 });
    } catch (error: any) {
        console.error('Error creating goods movement unit:', error);
        if (error.name === 'ValidationError') {
            return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Failed to create' }, { status: 500 });
    }
}
