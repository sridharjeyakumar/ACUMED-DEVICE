import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import GoodsMovementUnits from '@/server/models/GoodsMovementUnits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await ensureConnection();
        const body = await request.json();
        const updateData: any = {};
        if (body.status !== undefined) updateData.status = body.status;
        if (body.nett_qty !== undefined) updateData.nett_qty = Number(body.nett_qty);
        const record = await GoodsMovementUnits.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).lean();
        if (!record) return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
        return NextResponse.json(record);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await ensureConnection();
        const record = await GoodsMovementUnits.findByIdAndDelete(id);
        if (!record) return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to delete' }, { status: 500 });
    }
}
