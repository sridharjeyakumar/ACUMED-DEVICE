import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import GoodsReceiptUnits from '@/server/models/GoodsReceiptUnits';
import GoodsReceiptDetail from '@/server/models/GoodsReceiptDetail';
import { saveAudit } from '@/server/lib/AuditService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/goods-receipt-units
//   ?material_doc_no=M2500001                        → all units for a header
//   ?material_doc_no=M2500001&material_id=MAT01      → units for one detail row
//   ?material_id=MAT01&available=true                → status=A, balance_qty>0, sorted roll_no DESC
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
            filter.status      = 'A';
            filter.balance_qty = { $gt: 0 };
        }

        const sortOrder = available === 'true'
            ? { roll_no: -1 }
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
// Creates ONE unit row.
// PK: material_doc_no + material_id + sno (auto-incremented if omitted)
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        await ensureConnection();
        const body = await request.json();

        // Validate required fields
        const errors: string[] = [];
        if (!body.material_doc_no?.trim()) errors.push('material_doc_no is required.');
        if (!body.material_id?.trim())     errors.push('material_id is required.');
        if (body.nett_qty   == null || isNaN(Number(body.nett_qty)))   errors.push('nett_qty is required.');
        if (body.actual_qty == null || isNaN(Number(body.actual_qty))) errors.push('actual_qty is required.');
        if (body.balance_qty == null || isNaN(Number(body.balance_qty))) errors.push('balance_qty is required.');
        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(' | ') }, { status: 422 });
        }

        const docNo      = body.material_doc_no.trim().toUpperCase();
        const materialId = body.material_id.trim().toUpperCase();

        // Verify parent detail exists
        const detail = await GoodsReceiptDetail.findOne({ material_doc_no: docNo, material_id: materialId }).lean();
        if (!detail) {
            return NextResponse.json(
                { error: `GR Detail for doc '${docNo}' / material '${materialId}' not found. Create the detail row first.` },
                { status: 404 }
            );
        }

        // Auto-increment sno if not supplied
        let sno = body.sno != null ? Number(body.sno) : null;
        if (sno == null) {
            const last = await GoodsReceiptUnits.findOne({ material_doc_no: docNo, material_id: materialId })
                .sort({ sno: -1 })
                .lean();
            sno = last ? (last as any).sno + 1 : 1;
        }

        const consumed_qty = Number(body.consumed_qty ?? 0);
        const rejected_qty = Number(body.rejected_qty ?? 0);
        const actual_qty   = Number(body.actual_qty);
        const balance_qty  = body.balance_qty != null
            ? Number(body.balance_qty)
            : actual_qty - consumed_qty - rejected_qty;

        const unit = new GoodsReceiptUnits({
            material_doc_no: docNo,
            material_id:     materialId,
            sno,
            packet_no:    body.packet_no?.trim() || undefined,
            roll_no:      body.roll_no?.trim()   || undefined,
            nett_qty:     Number(body.nett_qty),
            uom:          body.uom?.trim().toUpperCase() || undefined,
            actual_qty,
            consumed_qty,
            rejected_qty,
            balance_qty,
            status:       body.status?.trim() || undefined,
        });

        await unit.save();

        // ── Audit Trail ──────────────────────────────────────────────────────
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
                { error: 'Duplicate unit (material_doc_no + material_id + sno already exists).' },
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