import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import GoodsReceiptUnits from '@/server/models/GoodsReceiptUnits';
import GoodsReceiptDetail from '@/server/models/GoodsReceiptDetail';
import MaterialMaster from '@/server/models/MaterialMaster';
import { saveAudit } from '@/server/lib/AuditService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/goods-receipt-units
//   ?material_doc_no=M2500001                        → all units for a header
//   ?material_doc_no=M2500001&material_id=MAT01      → units for one detail row
//   ?material_id=MAT01&available=true                → status=A, balance_qty>0, sorted roll_no ASC
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
    try {
        await ensureConnection();
        const { searchParams } = new URL(request.url);
        const docNo      = searchParams.get('material_doc_no');
        const materialId = searchParams.get('material_id');
        const available  = searchParams.get('available');

        const filter: Record<string, any> = {};
        if (docNo)      filter.material_doc_no = docNo.toUpperCase();
        if (materialId) filter.material_id     = materialId.toUpperCase();
        if (available === 'true') {
            filter.status = 'A';
            filter.balance_qty = { $gt: 0 };
        }

        const sortOrder = available === 'true'
            ? { roll_no: 1 }
            : { material_doc_no: 1, material_id: 1, sno: 1 };

        const units = await GoodsReceiptUnits.find(filter).lean().sort(sortOrder as any);

        return NextResponse.json(units);
    } catch (error: any) {
        console.error('GET /goods-receipt-units error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch GR Units' }, { status: 500 });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/goods-receipt-units
// Body: material_doc_no, material_id, packet_no, roll_no, gross_qty, status
// tare_qty fetched from MaterialMaster.core_weight; nett_qty computed server-side
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        await ensureConnection();
        const body = await request.json();

        // Validate required fields
        const errors: string[] = [];
        if (!body.material_doc_no?.trim()) errors.push('material_doc_no is required.');
        if (!body.material_id?.trim())     errors.push('material_id is required.');
        if (!body.packet_no?.trim())       errors.push('packet_no is required.');
        if (!body.roll_no?.trim())         errors.push('roll_no is required.');
        if (!body.status?.trim())          errors.push('status is required.');

        const grossQty = Number(body.gross_qty);
        if (body.gross_qty == null || isNaN(grossQty) || grossQty <= 0)
            errors.push('gross_qty is required and must be > 0.');

        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(' | ') }, { status: 422 });
        }

        const docNo      = body.material_doc_no.trim().toUpperCase();
        const materialId = body.material_id.trim().toUpperCase();
        const rollNo     = body.roll_no.trim();

        // Verify parent detail exists and get uom
        const detail = await GoodsReceiptDetail.findOne({ material_doc_no: docNo, material_id: materialId }).lean();
        if (!detail) {
            return NextResponse.json(
                { error: `GR Detail for doc '${docNo}' / material '${materialId}' not found.` },
                { status: 404 }
            );
        }

        // Check roll_no uniqueness within this doc + material
        const dupRoll = await GoodsReceiptUnits.findOne({ material_doc_no: docNo, material_id: materialId, roll_no: rollNo }).lean();
        if (dupRoll) {
            return NextResponse.json(
                { error: `Roll No '${rollNo}' already exists for this document and material.` },
                { status: 409 }
            );
        }

        // Fetch core_weight from MaterialMaster for tare_qty
        const material = await MaterialMaster.findOne({ material_id: materialId }).lean();
        const tareQty  = (material as any)?.core_weight ?? 0;
        const nettQty  = grossQty - tareQty;

        // Auto-increment sno
        let sno = body.sno != null ? Number(body.sno) : null;
        if (sno == null) {
            const last = await GoodsReceiptUnits.findOne({ material_doc_no: docNo, material_id: materialId })
                .sort({ sno: -1 }).lean();
            sno = last ? (last as any).sno + 1 : 1;
        }

        const unit = new GoodsReceiptUnits({
            material_doc_no: docNo,
            material_id:     materialId,
            sno,
            packet_no:   body.packet_no.trim(),
            roll_no:     rollNo,
            gross_qty:   grossQty,
            tare_qty:    tareQty,
            nett_qty:    nettQty,
            balance_qty: grossQty,
            uom:         (detail as any).uom || body.uom?.trim().toUpperCase() || '',
            status:      body.status.trim(),
        });

        await unit.save();

        try {
            await saveAudit({
                menu_id:           'T12',
                header_table_name: 'GoodsReceiptHeader',
                documnet_no:       docNo,
                change_user_id:    'ADMIN',
                tables: [{
                    table_name:      'GoodsReceiptUnits',
                    pk_field_names:  'material_doc_no|material_id|sno',
                    pk_field_values: `${docNo}|${materialId}|${sno}`,
                    old_data:        {},
                    new_data:        unit.toObject(),
                }],
            });
        } catch (auditErr) {
            console.error('Audit save failed (non-blocking):', auditErr);
        }

        return NextResponse.json(unit, { status: 201 });

    } catch (error: any) {
        console.error('POST /goods-receipt-units error:', error);
        if (error.code === 11000) {
            return NextResponse.json(
                { error: 'Duplicate roll_no for this document and material.' },
                { status: 409 }
            );
        }
        if (error.name === 'ValidationError') {
            return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Failed to create GR Unit' }, { status: 500 });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/goods-receipt-units
//   ?material_doc_no=M2500001              → delete all units for a header
//   ?material_doc_no=M2500001&material_id=MAT01  → delete units for one detail
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
    try {
        await ensureConnection();
        const { searchParams } = new URL(request.url);
        const docNo      = searchParams.get('material_doc_no');
        const materialId = searchParams.get('material_id');

        if (!docNo) {
            return NextResponse.json({ error: 'material_doc_no query param is required.' }, { status: 400 });
        }

        const filter: Record<string, string> = { material_doc_no: docNo.toUpperCase() };
        if (materialId) filter.material_id = materialId.toUpperCase();

        const result = await GoodsReceiptUnits.deleteMany(filter);
        return NextResponse.json({ deleted: result.deletedCount });
    } catch (error: any) {
        console.error('DELETE /goods-receipt-units error:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete GR Units' }, { status: 500 });
    }
}
