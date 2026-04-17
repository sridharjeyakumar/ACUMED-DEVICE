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
            po_no:                  body.po_no.trim().toUpperCase(),
            material_id:            body.material_id.trim().toUpperCase(),
            sno:                    Number(body.sno),
            po_qty:                 Number(body.po_qty),
            uom:                    body.uom.trim().toUpperCase(),
            material_spec:          body.material_spec?.trim() || undefined,
            remarks:                body.remarks?.trim() || undefined,
            gr_qty:                 body.gr_qty != null ? Number(body.gr_qty) : 0,
            balance_qty:            body.balance_qty != null ? Number(body.balance_qty) : 0,
            unit_price:             body.unit_price != null ? Number(body.unit_price) : undefined,
            basic_amount:           body.basic_amount != null ? Number(body.basic_amount) : undefined,
            gst_percentage:         body.gst_percentage != null ? Number(body.gst_percentage) : undefined,
            gst_amount:             body.gst_amount != null ? Number(body.gst_amount) : undefined,
            total_amount:           body.total_amount != null ? Number(body.total_amount) : undefined,
            expected_delivery_date: body.expected_delivery_date ? new Date(body.expected_delivery_date) : undefined,
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
// PATCH /api/purchase-order-details
//   ?po_no=P2600001&material_id=MAT01
//   Body: { add_gr_qty: number }
//   Adds add_gr_qty to gr_qty, recomputes balance_qty.
//   If all materials on the PO have gr_qty >= po_qty, sets PO status = 'C'.
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
    try {
        await ensureConnection();
        const { searchParams } = new URL(request.url);
        const poNo       = searchParams.get('po_no');
        const materialId = searchParams.get('material_id');

        if (!poNo || !materialId) {
            return NextResponse.json({ error: 'po_no and material_id query params are required.' }, { status: 400 });
        }

        const body        = await request.json();
        const addGrQty    = Number(body.add_gr_qty);
        if (isNaN(addGrQty) || addGrQty <= 0) {
            return NextResponse.json({ error: 'add_gr_qty must be a positive number.' }, { status: 422 });
        }

        const detail = await PurchaseOrderDetail.findOne({
            po_no:       poNo.toUpperCase(),
            material_id: materialId.toUpperCase(),
        });
        if (!detail) {
            return NextResponse.json({ error: `PO Detail not found for ${poNo} / ${materialId}.` }, { status: 404 });
        }

        const oldData    = detail.toObject();
        const newGrQty   = (detail.gr_qty || 0) + addGrQty;
        const newBalance = (detail.po_qty || 0) - newGrQty;

        detail.gr_qty      = newGrQty;
        detail.balance_qty = newBalance < 0 ? 0 : newBalance;
        await detail.save();

        // Check if ALL materials for this PO are fully received → close PO
        const allDetails = await PurchaseOrderDetail.find({ po_no: poNo.toUpperCase() }).lean();
        const allReceived = allDetails.every((d: any) => (d.gr_qty || 0) >= (d.po_qty || 0));
        if (allReceived) {
            await PurchaseOrder.findOneAndUpdate(
                { po_no: poNo.toUpperCase() },
                { $set: { status: 'C' } }
            );
        }

        try {
            await saveAudit({
                menu_id:           'T11',
                header_table_name: 'PurchaseOrder',
                documnet_no:       poNo.toUpperCase(),
                change_user_id:    'ADMIN',
                tables: [{
                    table_name:      'PurchaseOrderDetail',
                    pk_field_names:  'po_no|material_id',
                    pk_field_values: `${poNo.toUpperCase()}|${materialId.toUpperCase()}`,
                    old_data:        oldData,
                    new_data:        detail.toObject(),
                }],
            });
        } catch (auditErr) {
            console.error('Audit save failed (non-blocking):', auditErr);
        }

        return NextResponse.json({ gr_qty: detail.gr_qty, balance_qty: detail.balance_qty, po_closed: allReceived });
    } catch (error: any) {
        console.error('PATCH /purchase-order-details error:', error);
        return NextResponse.json({ error: error.message || 'Failed to update GR qty on PO Detail' }, { status: 500 });
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
