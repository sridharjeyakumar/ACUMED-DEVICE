import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { ensureConnection } from '@/server/db/connection';
import GoodsMovement from '@/server/models/GoodsMovement';
import GoodsMovementUnits from '@/server/models/GoodsMovementUnits';
import { applyApprovalStockUpdates } from '@/server/lib/goodsMovementHelpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── GM No. generation (call inside a session/transaction to avoid duplicates) ──
async function generateGmNo(session: mongoose.ClientSession): Promise<string> {
    const yy = new Date().getFullYear().toString().slice(-2);
    const prefix = `G${yy}`;
    const last = await GoodsMovement
        .findOne({ gm_no: { $regex: `^${prefix}` } })
        .sort({ gm_no: -1 })
        .session(session)
        .lean();
    const lastSerial = last ? parseInt((last as any).gm_no.slice(prefix.length), 10) || 0 : 0;
    return `${prefix}${String(lastSerial + 1).padStart(5, '0')}`;
}

// ── GET all ──────────────────────────────────────────────────────────────────
export async function GET() {
    try {
        await ensureConnection();
        const records = await GoodsMovement.find().lean().sort({ gm_no: -1 });
        return NextResponse.json(records, {
            headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
        });
    } catch (error: any) {
        console.error('Error fetching goods movements:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch' }, { status: 500 });
    }
}

// ── POST (create) ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    await ensureConnection();
    const body = await request.json();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Generate GM No. inside the transaction (locked)
        const gm_no = await generateGmNo(session);

        const status = body.status || 'E';

        // 1. Save GM Header
        const [record] = await GoodsMovement.create([{
            ...body,
            gm_no,
            gm_date:           body.gm_date ? new Date(body.gm_date) : new Date(),
            material_doc_date: body.material_doc_date ? new Date(body.material_doc_date) : undefined,
            entered_date_time: new Date(),
            status,
        }], { session });

        // 2. Save GM Units if provided
        const units: any[] = Array.isArray(body.units) ? body.units : [];
        if (units.length > 0) {
            await GoodsMovementUnits.insertMany(
                units.map(u => ({
                    gm_no,
                    roll_no:  u.roll_no,
                    nett_qty: Number(u.nett_qty),
                    uom:      u.uom,
                    status:   'E',
                })),
                { session }
            );
        }

        // 3. If immediately approved → cascade stock updates
        if (status === 'A') {
            await applyApprovalStockUpdates(
                gm_no,
                body.material_id,
                Number(body.total_nett_qty),
                body.material_doc_no || undefined,
                session
            );
        }

        await session.commitTransaction();
        return NextResponse.json(record, { status: 201 });

    } catch (error: any) {
        await session.abortTransaction();
        console.error('Error creating goods movement:', error);
        if (error.code === 11000) {
            return NextResponse.json({ error: 'GM number already exists' }, { status: 400 });
        }
        if (error.name === 'ValidationError') {
            return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Failed to create goods movement' }, { status: 500 });
    } finally {
        session.endSession();
    }
}
