import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import GoodsReceiptDetail from '@/server/models/GoodsReceiptDetail';
import GoodsReceiptHeader from '@/server/models/GoodsReceiptHeader';
import { saveAudit } from '@/server/lib/AuditService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/goods-receipt-details
//   ?material_doc_no=M2500001   → all details for one header (most common)
//   (no query param)            → all details (admin use)
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
    try {
        await ensureConnection();

        const { searchParams } = new URL(request.url);
        const docNo = searchParams.get('material_doc_no');

        const filter = docNo ? { material_doc_no: docNo.toUpperCase() } : {};
        const details = await GoodsReceiptDetail.find(filter)
            .lean()
            .sort({ material_doc_no: 1, material_id: 1 });

        return NextResponse.json(details);
    } catch (error: any) {
        console.error('GET /goods-receipt-details error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch GR Details' },
            { status: 500 }
        );
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/goods-receipt-details
// Creates ONE detail row.
// Body must include: material_doc_no, material_id, invoice_total_nett_qty, uom
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        await ensureConnection();
        const body = await request.json();

        // Validate required fields
        const errors: string[] = [];
        if (!body.material_doc_no?.trim()) errors.push('material_doc_no is required.');
        if (!body.material_id?.trim())     errors.push('material_id is required.');
        if (!body.uom?.trim())             errors.push('uom is required.');

        const grossQty = Number(body.invoice_total_gross_qty);
        const tareQty  = Number(body.invoice_total_tare_qty);
        if (body.invoice_total_gross_qty == null || isNaN(grossQty) || grossQty <= 0)
            errors.push('invoice_total_gross_qty is required and must be > 0.');
        if (body.invoice_total_tare_qty == null || isNaN(tareQty) || tareQty <= 0)
            errors.push('invoice_total_tare_qty is required and must be > 0.');
        else if (!isNaN(grossQty) && tareQty >= grossQty)
            errors.push('invoice_total_tare_qty must be less than invoice_total_gross_qty.');

        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(' | ') }, { status: 422 });
        }

        const nettQty = grossQty - tareQty;

        // Verify parent header exists
        const header = await GoodsReceiptHeader.findOne({
            material_doc_no: body.material_doc_no.trim().toUpperCase(),
        }).lean();
        if (!header) {
            return NextResponse.json(
                { error: `Header '${body.material_doc_no}' not found.` },
                { status: 404 }
            );
        }

        // Prevent duplicate (material_doc_no + material_id) per header
        const existing = await GoodsReceiptDetail.findOne({
            material_doc_no: body.material_doc_no.trim().toUpperCase(),
            material_id:     body.material_id.trim().toUpperCase(),
        }).lean();
        if (existing) {
            return NextResponse.json(
                { error: `Detail for material '${body.material_id}' already exists on this document.` },
                { status: 409 }
            );
        }

        const detail = new GoodsReceiptDetail({
            material_doc_no:        body.material_doc_no.trim().toUpperCase(),
            material_id:            body.material_id.trim().toUpperCase(),
            invoice_total_gross_qty: grossQty,
            invoice_total_tare_qty:  tareQty,
            invoice_total_nett_qty:  nettQty,
            uom:                    body.uom.trim().toUpperCase(),
            total_pockets:          body.total_pockets != null ? Number(body.total_pockets) : undefined,
            total_rolls:            body.total_rolls   != null ? Number(body.total_rolls)   : undefined,
            existing_stock_qty:     body.existing_stock_qty   != null ? Number(body.existing_stock_qty)   : 0,
            existing_total_rolls:   body.existing_total_rolls != null ? Number(body.existing_total_rolls) : 0,
        });

        await detail.save();

        // ── Audit Trail ──────────────────────────────────────────────────────
        try {
            await saveAudit({
                menu_id:           'T12',
                header_table_name: 'GoodsReceiptHeader',
                documnet_no:       detail.material_doc_no,
                change_user_id:    'ADMIN',
                tables: [{
                    table_name:      'GoodsReceiptDetail',
                    pk_field_names:  'material_doc_no|material_id',
                    pk_field_values: `${detail.material_doc_no}|${detail.material_id}`,
                    old_data:        {},
                    new_data:        detail.toObject(),
                }],
            });
        } catch (auditErr) {
            console.error('Audit save failed (non-blocking):', auditErr);
        }

        return NextResponse.json(detail, { status: 201 });

    } catch (error: any) {
        console.error('POST /goods-receipt-details error:', error);
        if (error.code === 11000) {
            return NextResponse.json(
                { error: 'Duplicate detail record. This material already exists on the document.' },
                { status: 409 }
            );
        }
        if (error.name === 'ValidationError') {
            return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 400 });
        }
        return NextResponse.json(
            { error: error.message || 'Failed to create GR Detail' },
            { status: 500 }
        );
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/goods-receipt-details
//   ?material_doc_no=M2500001  → delete ALL details for that header (cascade)
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
    try {
        await ensureConnection();
        const { searchParams } = new URL(request.url);
        const docNo = searchParams.get('material_doc_no');

        if (!docNo) {
            return NextResponse.json({ error: 'material_doc_no query param is required.' }, { status: 400 });
        }

        const result = await GoodsReceiptDetail.deleteMany({ material_doc_no: docNo.toUpperCase() });
        return NextResponse.json({ deleted: result.deletedCount });
    } catch (error: any) {
        console.error('DELETE /goods-receipt-details error:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete GR Details' }, { status: 500 });
    }
}