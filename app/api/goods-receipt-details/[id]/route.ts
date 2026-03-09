import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import GoodsReceiptDetail from '@/server/models/GoodsReceiptDetail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────────
// [id] here is the MongoDB _id of the detail document.
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/goods-receipt-details/[id]
export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await ensureConnection();
        const detail = await GoodsReceiptDetail.findById(params.id).lean();
        if (!detail) {
            return NextResponse.json({ error: 'GR Detail not found.' }, { status: 404 });
        }
        return NextResponse.json(detail);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to fetch GR Detail' }, { status: 500 });
    }
}

// PUT /api/goods-receipt-details/[id]
// Updatable fields: invoice_total_nett_qty, uom, total_pockets, total_rolls,
//                  existing_stock_qty, existing_total_rolls
// material_doc_no and material_id are immutable (PK parts).
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await ensureConnection();
        const body = await request.json();

        // Strip PK fields — they must not change
        delete body.material_doc_no;
        delete body.material_id;

        // Validate updatable numerics
        const errors: string[] = [];
        if (body.invoice_total_nett_qty != null && isNaN(Number(body.invoice_total_nett_qty)))
            errors.push('invoice_total_nett_qty must be a number.');
        if (body.total_pockets != null && isNaN(Number(body.total_pockets)))
            errors.push('total_pockets must be a number.');
        if (body.total_rolls != null && isNaN(Number(body.total_rolls)))
            errors.push('total_rolls must be a number.');
        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(' | ') }, { status: 422 });
        }

        const updatePayload: Record<string, any> = {};
        if (body.invoice_total_nett_qty != null) updatePayload.invoice_total_nett_qty = Number(body.invoice_total_nett_qty);
        if (body.uom)                           updatePayload.uom                     = body.uom.trim().toUpperCase();
        if (body.total_pockets != null)         updatePayload.total_pockets           = Number(body.total_pockets);
        if (body.total_rolls != null)           updatePayload.total_rolls             = Number(body.total_rolls);
        if (body.existing_stock_qty != null)    updatePayload.existing_stock_qty      = Number(body.existing_stock_qty);
        if (body.existing_total_rolls != null)  updatePayload.existing_total_rolls    = Number(body.existing_total_rolls);

        const updated = await GoodsReceiptDetail.findByIdAndUpdate(
            params.id,
            { $set: updatePayload },
            { new: true, runValidators: true }
        ).lean();

        if (!updated) {
            return NextResponse.json({ error: 'GR Detail not found.' }, { status: 404 });
        }
        return NextResponse.json(updated);
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Failed to update GR Detail' }, { status: 500 });
    }
}

// DELETE /api/goods-receipt-details/[id]
export async function DELETE(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await ensureConnection();
        const deleted = await GoodsReceiptDetail.findByIdAndDelete(params.id).lean();
        if (!deleted) {
            return NextResponse.json({ error: 'GR Detail not found.' }, { status: 404 });
        }
        return NextResponse.json({ message: 'GR Detail deleted successfully.' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to delete GR Detail' }, { status: 500 });
    }
}