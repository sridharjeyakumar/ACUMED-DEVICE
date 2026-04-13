import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import PurchaseOrderDetail from '@/server/models/PurchaseOrderDetail';
import PurchaseOrder from '@/server/models/PurchaseOrder';
import { saveAudit } from '@/server/lib/AuditService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/purchase-order-details
//   ?po_no=P2600001  → all detail rows for that PO (most common)
//   (no query param) → all rows (admin use)
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
    try {
        await ensureConnection();
        const { searchParams } = new URL(request.url);
        const poNo = searchParams.get('po_no');
        const filter = poNo ? { po_no: poNo.toUpperCase() } : {};
        const details = await PurchaseOrderDetail.find(filter)
            .lean()
            .sort({ po_no: 1, sno: 1 });
        return NextResponse.json(details);
    } catch (error: any) {
        console.error('GET /purchase-order-details error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch PO Details' },
            { status: 500 }
        );
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/purchase-order-details — create one detail row
// Required: po_no, material_id, sno, po_qty, uom
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        await ensureConnection();
        const body = await request.json();

        const errors: string[] = [];
        if (!body.po_no?.trim())       errors.push('po_no is required.');
        if (!body.material_id?.trim()) errors.push('material_id is required.');
        if (body.sno == null || isNaN(Number(body.sno))) errors.push('sno is required and must be a number.');
        if (body.po_qty == null || isNaN(Number(body.po_qty))) errors.push('po_qty is required and must be a number.');
        if (!body.uom?.trim())         errors.push('uom is required.');
        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(' | ') }, { status: 422 });
        }

        // Verify parent PO exists
        const header = await PurchaseOrder.findOne({
            po_no: body.po_no.trim().toUpperCase(),
        }).lean();
        if (!header) {
            return NextResponse.json(
                { error: `Purchase Order '${body.po_no}' not found.` },
                { status: 404 }
            );
        }

        // Prevent duplicate material on same PO
        const existing = await PurchaseOrderDetail.findOne({
            po_no: body.po_no.trim().toUpperCase(),
            material_id: body.material_id.trim().toUpperCase(),
        }).lean();
        if (existing) {
            return NextResponse.json(
                { error: `Material '${body.material_id}' already exists on this PO.` },
                { status: 409 }
            );
        }

        const detail = new PurchaseOrderDetail({
            po_no:         body.po_no.trim().toUpperCase(),
            material_id:   body.material_id.trim().toUpperCase(),
            sno:           Number(body.sno),
            po_qty:        Number(body.po_qty),
            uom:           body.uom.trim().toUpperCase(),
            material_spec: body.material_spec?.trim() || undefined,
            remarks:       body.remarks?.trim() || undefined,
            gr_qty:        body.gr_qty != null ? Number(body.gr_qty) : 0,
            balance_qty:   body.balance_qty != null ? Number(body.balance_qty) : 0,
        });

        await detail.save();

        try {
            await saveAudit({
                menu_id:           'T11',
                header_table_name: 'PurchaseOrder',
                documnet_no:       detail.po_no,
                change_user_id:    'ADMIN',
                tables: [{
                    table_name:      'PurchaseOrderDetail',
                    pk_field_names:  'po_no|material_id',
                    pk_field_values: `${detail.po_no}|${detail.material_id}`,
                    old_data:        {},
                    new_data:        detail.toObject(),
                }],
            });
        } catch (auditErr) {
            console.error('Audit save failed (non-blocking):', auditErr);
        }

        return NextResponse.json(detail, { status: 201 });
    } catch (error: any) {
        console.error('POST /purchase-order-details error:', error);
        if (error.code === 11000) {
            return NextResponse.json(
                { error: 'Duplicate detail record. This material already exists on this PO.' },
                { status: 409 }
            );
        }
        if (error.name === 'ValidationError') {
            return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 400 });
        }
        return NextResponse.json(
            { error: error.message || 'Failed to create PO Detail' },
            { status: 500 }
        );
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/purchase-order-details
//   ?po_no=P2600001  → cascade-delete ALL details for that PO
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
    try {
        await ensureConnection();
        const { searchParams } = new URL(request.url);
        const poNo = searchParams.get('po_no');
        if (!poNo) {
            return NextResponse.json({ error: 'po_no query param is required.' }, { status: 400 });
        }
        const result = await PurchaseOrderDetail.deleteMany({ po_no: poNo.toUpperCase() });
        return NextResponse.json({ deleted: result.deletedCount });
    } catch (error: any) {
        console.error('DELETE /purchase-order-details error:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete PO Details' }, { status: 500 });
    }
}
