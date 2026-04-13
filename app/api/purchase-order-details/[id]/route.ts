import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import PurchaseOrderDetail from '@/server/models/PurchaseOrderDetail';
import { saveAudit } from '@/server/lib/AuditService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// [id] is the MongoDB _id of the detail document.

// GET /api/purchase-order-details/[id]
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await ensureConnection();
        const { id } = await params;
        const detail = await PurchaseOrderDetail.findById(id).lean();
        if (!detail) {
            return NextResponse.json({ error: 'PO Detail not found.' }, { status: 404 });
        }
        return NextResponse.json(detail);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to fetch PO Detail' }, { status: 500 });
    }
}

// PUT /api/purchase-order-details/[id]
// Updatable: sno, po_qty, uom, material_spec, remarks
// po_no and material_id are immutable (PK parts).
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await ensureConnection();
        const { id } = await params;
        const body = await request.json();

        const existing = await PurchaseOrderDetail.findById(id).lean();
        if (!existing) {
            return NextResponse.json({ error: 'PO Detail not found.' }, { status: 404 });
        }

        // Strip immutable PK fields
        delete body.po_no;
        delete body.material_id;

        const errors: string[] = [];
        if (body.po_qty != null && isNaN(Number(body.po_qty)))
            errors.push('po_qty must be a number.');
        if (body.sno != null && isNaN(Number(body.sno)))
            errors.push('sno must be a number.');
        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(' | ') }, { status: 422 });
        }

        const updatePayload: Record<string, any> = {};
        if (body.sno != null)           updatePayload.sno           = Number(body.sno);
        if (body.po_qty != null)        updatePayload.po_qty        = Number(body.po_qty);
        if (body.uom)                   updatePayload.uom           = body.uom.trim().toUpperCase();
        if (body.material_spec != null) updatePayload.material_spec = body.material_spec?.trim() || undefined;
        if (body.remarks != null)       updatePayload.remarks       = body.remarks?.trim() || undefined;

        const updated = await PurchaseOrderDetail.findByIdAndUpdate(
            id,
            { $set: updatePayload },
            { new: true, runValidators: true }
        ).lean();

        if (!updated) {
            return NextResponse.json({ error: 'PO Detail not found.' }, { status: 404 });
        }

        try {
            const poNo      = (existing as any).po_no || '';
            const materialId = (existing as any).material_id || '';
            await saveAudit({
                menu_id:           'T11',
                header_table_name: 'PurchaseOrder',
                documnet_no:       poNo,
                change_user_id:    'ADMIN',
                tables: [{
                    table_name:      'PurchaseOrderDetail',
                    pk_field_names:  'po_no|material_id',
                    pk_field_values: `${poNo}|${materialId}`,
                    old_data:        existing as any,
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
        return NextResponse.json({ error: error.message || 'Failed to update PO Detail' }, { status: 500 });
    }
}

// DELETE /api/purchase-order-details/[id]
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await ensureConnection();
        const { id } = await params;
        const deleted = await PurchaseOrderDetail.findByIdAndDelete(id).lean();
        if (!deleted) {
            return NextResponse.json({ error: 'PO Detail not found.' }, { status: 404 });
        }
        return NextResponse.json({ message: 'PO Detail deleted successfully.' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to delete PO Detail' }, { status: 500 });
    }
}
