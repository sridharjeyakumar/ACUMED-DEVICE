import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { ensureConnection } from '@/server/db/connection';
import GoodsMovement from '@/server/models/GoodsMovement';
import GoodsMovementUnits from '@/server/models/GoodsMovementUnits';
import { applyApprovalStockUpdates } from '@/server/lib/goodsMovementHelpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await ensureConnection();
        const record = await GoodsMovement.findOne({ gm_no: id }).lean();
        if (!record) return NextResponse.json({ error: 'Goods movement not found' }, { status: 404 });
        return NextResponse.json(record);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to fetch' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    await ensureConnection();
    const body = await request.json();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Fetch existing record to know material_id, material_doc_no, total_nett_qty
        const existing = await GoodsMovement.findOne({ gm_no: id }).session(session).lean() as any;
        if (!existing) {
            await session.abortTransaction();
            return NextResponse.json({ error: 'Goods movement not found' }, { status: 404 });
        }

        const clean = (v: any) => (v === '' || v === null) ? undefined : v;

        const updateData: any = {};
        if (body.approval_remarks   !== undefined) updateData.approval_remarks   = clean(body.approval_remarks);
        if (body.approved_by_user_id !== undefined) updateData.approved_by_user_id = clean(body.approved_by_user_id);
        if (body.approved_date_time !== undefined) updateData.approved_date_time  = new Date(body.approved_date_time);
        if (body.status             !== undefined) updateData.status              = body.status;

        // Update GM Header
        const record = await GoodsMovement.findOneAndUpdate(
            { gm_no: id },
            { $set: updateData },
            { new: true, runValidators: true, session }
        ).lean();

        const newStatus = body.status;

        if (newStatus === 'A') {
            // Approval → cascade stock updates
            await applyApprovalStockUpdates(
                id,
                existing.material_id,
                Number(existing.total_nett_qty),
                existing.material_doc_no || undefined,
                session
            );
        } else if (newStatus === 'X') {
            // Cancel → mark GM Units as cancelled
            await GoodsMovementUnits.updateMany(
                { gm_no: id },
                { $set: { status: 'X' } },
                { session }
            );
        }

        await session.commitTransaction();
        return NextResponse.json(record);

    } catch (error: any) {
        await session.abortTransaction();
        if (error.name === 'ValidationError') {
            return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 });
    } finally {
        session.endSession();
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await ensureConnection();
        const record = await GoodsMovement.findOneAndDelete({ gm_no: id });
        if (!record) return NextResponse.json({ error: 'Goods movement not found' }, { status: 404 });
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to delete' }, { status: 500 });
    }
}
