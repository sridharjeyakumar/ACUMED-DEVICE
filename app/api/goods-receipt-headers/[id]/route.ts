import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import GoodsReceiptHeader from '@/server/models/GoodsReceiptHeader';
import GoodsReceiptDetail from '@/server/models/GoodsReceiptDetail';
import GoodsReceiptUnits from '@/server/models/GoodsReceiptUnits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/goods-receipt-headers/[id] - Get a single Goods Receipt Header
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await ensureConnection();
        const header = await GoodsReceiptHeader.findOne({
            material_doc_no: params.id.toUpperCase(),
        }).lean();

        if (!header) {
            return NextResponse.json(
                { error: `Goods Receipt Header '${params.id}' not found` },
                { status: 404 }
            );
        }

        return NextResponse.json(header, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching Goods Receipt Header:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch Goods Receipt Header' },
            { status: 500 }
        );
    }
}

// Server-side validation for edit (PUT)
async function validateGRHeaderEdit(body: any) {
    const errors: string[] = [];
    const today = new Date(); today.setHours(23, 59, 59, 999);
    const now = new Date();
    const toDate = (val: any) => val ? new Date(val) : null;

    const docDate = toDate(body.material_doc_date);
    if (!docDate) {
        errors.push("material_doc_date is required.");
    } else if (docDate > today) {
        errors.push("Material Doc Date cannot be a future date.");
    }

    if (body.material_doc_time && docDate) {
        const docDateStr = docDate.toISOString().split('T')[0];
        const todayStr = now.toISOString().split('T')[0];
        if (docDateStr === todayStr) {
            const [h, m] = body.material_doc_time.split(':').map(Number);
            if ((h * 60 + m) > (now.getHours() * 60 + now.getMinutes())) {
                errors.push(`Material Doc Time cannot be in the future.`);
            }
        }
    }

    if (!body.invoice_no?.trim()) errors.push("Invoice No is required.");

    const invoiceDate = toDate(body.invoice_date);
    if (!invoiceDate) errors.push("Invoice Date is required.");
    else if (invoiceDate > today) errors.push("Invoice Date cannot be a future date.");

    if (!body.po_no?.trim()) errors.push("PO No is required.");

    const poDate = toDate(body.po_date);
    if (!poDate) errors.push("PO Date is required.");
    else if (poDate > today) errors.push("PO Date cannot be a future date.");

    return errors;
}

// PUT /api/goods-receipt-headers/[id] - Update a Goods Receipt Header
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await ensureConnection();
        const body = await request.json();

        // Server-side validation
        const validationErrors = await validateGRHeaderEdit(body);
        if (validationErrors.length > 0) {
            return NextResponse.json({ error: validationErrors.join(' | ') }, { status: 422 });
        }

        // Prevent changing the primary key
        delete body.material_doc_no;

        const updated = await GoodsReceiptHeader.findOneAndUpdate(
            { material_doc_no: params.id.toUpperCase() },
            {
                ...body,
                last_modified_user_id: body.last_modified_user_id || 'ADMIN',
                last_modified_date_time: new Date(),
            },
            { new: true, runValidators: true }
        ).lean();

        if (!updated) {
            return NextResponse.json(
                { error: `Goods Receipt Header '${params.id}' not found` },
                { status: 404 }
            );
        }

        return NextResponse.json(updated, { status: 200 });
    } catch (error: any) {
        console.error('Error updating Goods Receipt Header:', error);

        if (error.name === 'ValidationError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error.message },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: error.message || 'Failed to update Goods Receipt Header' },
            { status: 500 }
        );
    }
}

// PATCH /api/goods-receipt-headers/[id] - Partial update (e.g., cancel: set active=false)
export async function PATCH(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await ensureConnection();
        const body = await _request.json();
        const updated = await GoodsReceiptHeader.findOneAndUpdate(
            { material_doc_no: params.id.toUpperCase() },
            { ...body, last_modified_date_time: new Date() },
            { new: true }
        ).lean();
        if (!updated) {
            return NextResponse.json({ error: `GR '${params.id}' not found` }, { status: 404 });
        }
        return NextResponse.json(updated, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 });
    }
}

// DELETE /api/goods-receipt-headers/[id] - Delete a Goods Receipt Header
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await ensureConnection();

        const docNo = params.id.toUpperCase();

        const deleted = await GoodsReceiptHeader.findOneAndDelete({
            material_doc_no: docNo,
        }).lean();

        if (!deleted) {
            return NextResponse.json(
                { error: `Goods Receipt Header '${params.id}' not found` },
                { status: 404 }
            );
        }

        // Cascade delete: remove all related detail rows and unit rows
        await Promise.all([
            GoodsReceiptDetail.deleteMany({ material_doc_no: docNo }),
            GoodsReceiptUnits.deleteMany({ material_doc_no: docNo }),
        ]);

        return NextResponse.json(
            { message: `Goods Receipt Header '${params.id}' and all related records deleted successfully` },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error deleting Goods Receipt Header:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete Goods Receipt Header' },
            { status: 500 }
        );
    }
}