import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import GoodsReceiptUnits from '@/server/models/GoodsReceiptUnits';
import { saveAudit } from '@/server/lib/AuditService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────────
// [id] = MongoDB _id of the unit document.
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/goods-receipt-units/[id]
export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await ensureConnection();
        const unit = await GoodsReceiptUnits.findById(params.id).lean();
        if (!unit) return NextResponse.json({ error: 'GR Unit not found.' }, { status: 404 });
        return NextResponse.json(unit);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to fetch GR Unit' }, { status: 500 });
    }
}

// PUT /api/goods-receipt-units/[id]
// Updatable fields: packet_no, roll_no, nett_qty, uom, actual_qty,
//                  consumed_qty, rejected_qty, balance_qty, status
// PK fields (material_doc_no, material_id, sno) are immutable.
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await ensureConnection();
        const body = await request.json();

        // Fetch existing for audit (has pk fields: material_doc_no, material_id, sno)
        const existing = await GoodsReceiptUnits.findById(params.id).lean() as any;

        // Strip PK fields
        delete body.material_doc_no;
        delete body.material_id;
        delete body.sno;

        const errors: string[] = [];
        if (body.nett_qty   != null && isNaN(Number(body.nett_qty)))   errors.push('nett_qty must be a number.');
        if (body.actual_qty != null && isNaN(Number(body.actual_qty))) errors.push('actual_qty must be a number.');
        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(' | ') }, { status: 422 });
        }

        // Build update payload
        const updatePayload: Record<string, any> = {};
        if (body.packet_no   !== undefined) updatePayload.packet_no    = body.packet_no?.trim()  || undefined;
        if (body.roll_no     !== undefined) updatePayload.roll_no      = body.roll_no?.trim()    || undefined;
        if (body.nett_qty    != null)       updatePayload.nett_qty     = Number(body.nett_qty);
        if (body.uom         !== undefined) updatePayload.uom          = body.uom?.trim().toUpperCase() || undefined;
        if (body.actual_qty  != null)       updatePayload.actual_qty   = Number(body.actual_qty);
        if (body.consumed_qty != null)      updatePayload.consumed_qty = Number(body.consumed_qty);
        if (body.rejected_qty != null)      updatePayload.rejected_qty = Number(body.rejected_qty);
        if (body.status      !== undefined) updatePayload.status       = body.status?.trim() || undefined;

        // Recompute balance if actual/consumed/rejected changed
        if (body.actual_qty != null || body.consumed_qty != null || body.rejected_qty != null) {
            if (existing) {
                const actual   = updatePayload.actual_qty   ?? existing.actual_qty;
                const consumed = updatePayload.consumed_qty ?? existing.consumed_qty;
                const rejected = updatePayload.rejected_qty ?? existing.rejected_qty;
                updatePayload.balance_qty = actual - consumed - rejected;
            }
        } else if (body.balance_qty != null) {
            // Allow explicit override
            updatePayload.balance_qty = Number(body.balance_qty);
        }

        const updated = await GoodsReceiptUnits.findByIdAndUpdate(
            params.id,
            { $set: updatePayload },
            { new: true, runValidators: true }
        ).lean();

        if (!updated) return NextResponse.json({ error: 'GR Unit not found.' }, { status: 404 });

        // ── Audit Trail ──────────────────────────────────────────────────────
        try {
            const docNo      = existing?.material_doc_no || '';
            const materialId = existing?.material_id     || '';
            const sno        = existing?.sno             ?? '';
            await saveAudit({
                menu_id:           'T12',
                header_table_name: 'GoodsReceiptHeader',
                documnet_no:       docNo,
                change_user_id:    'ADMIN',
                tables: [{
                    table_name:      'GoodsReceiptUnits',
                    pk_field_names:  'material_doc_no|material_id|sno',
                    pk_field_values: `${docNo}|${materialId}|${sno}`,
                    old_data:        existing || {},
                    new_data:        updatePayload,
                }],
            });
        } catch (auditErr) {
            console.error('Audit save failed (non-blocking):', auditErr);
        }

        return NextResponse.json(updated);

    } catch (error: any) {
        if (error.name === 'ValidationError') {
            return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Failed to update GR Unit' }, { status: 500 });
    }
}

// DELETE /api/goods-receipt-units/[id]
export async function DELETE(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await ensureConnection();
        const deleted = await GoodsReceiptUnits.findByIdAndDelete(params.id).lean();
        if (!deleted) return NextResponse.json({ error: 'GR Unit not found.' }, { status: 404 });
        return NextResponse.json({ message: 'GR Unit deleted successfully.' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to delete GR Unit' }, { status: 500 });
    }
}