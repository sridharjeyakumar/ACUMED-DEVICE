import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import GoodsReceiptHeader from '@/server/models/GoodsReceiptHeader';
import { saveAudit } from '@/server/lib/AuditService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/goods-receipt-headers - Get all Goods Receipt Headers
export async function GET() {
    try {
        await ensureConnection();
        const headers = await GoodsReceiptHeader.find().lean().sort({ material_doc_no: 1 });
        return NextResponse.json(headers, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            },
        });
    } catch (error: any) {
        console.error('Error fetching Goods Receipt Headers:', error);

        const errorMessage = error.message || 'Failed to fetch Goods Receipt Headers';
        const isDbError = error.message?.includes('Database') ||
            error.message?.includes('MongoDB') ||
            error.message?.includes('connection') ||
            error.message?.includes('environment variable');

        return NextResponse.json(
            {
                error: errorMessage,
                details: isDbError ? 'Database connection issue. Please check your Database environment variable.' : undefined,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}

// Helper: Auto-generate material_doc_no → M + YY + 00001 (resets every year)
async function generateMaterialDocNo(): Promise<string> {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2); // e.g. "25"
    const prefix = `M${yy}`; // e.g. "M25"

    // Find the last document for the current year
    const lastDoc = await GoodsReceiptHeader.findOne({
        material_doc_no: { $regex: `^${prefix}` },
    })
        .sort({ material_doc_no: -1 })
        .lean();

    let nextSeq = 1;
    if (lastDoc) {
        // Extract the numeric part after the prefix (e.g. "M2500042" → 42)
        const lastSeq = parseInt((lastDoc as any).material_doc_no.slice(prefix.length), 10);
        if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
    }

    // Zero-pad to 5 digits → total length = 1 (M) + 2 (YY) + 5 = 8 chars (fits Char(8))
    const serial = String(nextSeq).padStart(5, '0');
    return `${prefix}${serial}`; // e.g. "M2500001"
}

// Server-side validation for POST/PUT
async function validateGRHeader(body: any, isEdit = false) {
    const errors = [];
    const nowIST = new Date(Date.now() + 5.5 * 3600 * 1000);
    const today = new Date(nowIST); today.setUTCHours(23, 59, 59, 999);
    const now = nowIST;

    const toDate = (val: any) => val ? new Date(val) : null;

    // Material Doc Date: >= last record date, <= today
    const docDate = toDate(body.material_doc_date);
    if (!docDate) {
        errors.push("material_doc_date is required.");
    } else {
        if (docDate > today) errors.push("Material Doc Date cannot be a future date.");
        if (!isEdit) {
            const lastRecord = await GoodsReceiptHeader.findOne({}).sort({ material_doc_date: -1 }).lean();
            if (lastRecord && (lastRecord as any).material_doc_date) {
                const lastDate = new Date((lastRecord as any).material_doc_date);
                lastDate.setHours(0,0,0,0);
                const docDateOnly = new Date(docDate); docDateOnly.setHours(0,0,0,0);
                if (docDateOnly < lastDate) {
                    errors.push(`Material Doc Date must be >= last record date (${lastDate.toISOString().split('T')[0]}).`);
                }
            }
        }
    }

    // Material Doc Time: if today, must be <= current time
    if (body.material_doc_time && docDate) {
        const docDateStr = docDate.toISOString().split('T')[0];
        const todayStr = nowIST.toISOString().split('T')[0];
        if (docDateStr === todayStr) {
            const [h, m] = body.material_doc_time.split(':').map(Number);
            const inputMinutes = h * 60 + m;
            const nowMinutes = nowIST.getUTCHours() * 60 + nowIST.getUTCMinutes();
            if (inputMinutes > nowMinutes) {
                errors.push(`Material Doc Time cannot be in the future (current IST: ${String(nowIST.getUTCHours()).padStart(2,'0')}:${String(nowIST.getUTCMinutes()).padStart(2,'0')}).`);
            }
        }
    }

    // Invoice No: required
    if (!body.invoice_no?.trim()) errors.push("Invoice No is required.");

    // Invoice Date: required, <= today, combo not already in table
    const invoiceDate = toDate(body.invoice_date);
    if (!invoiceDate) {
        errors.push("Invoice Date is required.");
    } else if (invoiceDate > today) {
        errors.push("Invoice Date cannot be a future date.");
    } else if (!isEdit && body.invoice_no?.trim()) {
        const dupInvoice = await GoodsReceiptHeader.findOne({
            invoice_no: { $regex: new RegExp(`^${body.invoice_no.trim()}$`, 'i') },
            invoice_date: { 
                $gte: new Date(invoiceDate.toISOString().split('T')[0]),
                $lt: new Date(new Date(invoiceDate.toISOString().split('T')[0]).getTime() + 86400000)
            }
        }).lean();
        if (dupInvoice) errors.push("This Invoice No + Invoice Date combination already exists.");
    }

    // PO No: required
    if (!body.po_no?.trim()) errors.push("PO No is required.");

    // PO Date: required, <= today
    const poDate = toDate(body.po_date);
    if (!poDate) {
        errors.push("PO Date is required.");
    } else if (poDate > today) {
        errors.push("PO Date cannot be a future date.");
    }

    return errors;
}

// POST /api/goods-receipt-headers - Create a new Goods Receipt Header
export async function POST(request: NextRequest) {
    try {
        await ensureConnection();
        const body = await request.json();

        // Server-side validation
        const validationErrors = await validateGRHeader(body, false);
        if (validationErrors.length > 0) {
            return NextResponse.json({ error: validationErrors.join(' | ') }, { status: 422 });
        }

        // Auto-generate material_doc_no — ignore any value sent from client
        const material_doc_no = await generateMaterialDocNo();

        const header = new GoodsReceiptHeader({
            ...body,
            material_doc_no,
            last_modified_user_id: body.last_modified_user_id || 'ADMIN',
            last_modified_date_time: new Date(),
        });

        await header.save();

        // ── Audit Trail ──────────────────────────────────────────────────────
        try {
            await saveAudit({
                menu_id:           'T12',
                header_table_name: 'GoodsReceiptHeader',
                documnet_no:       header.material_doc_no,
                change_user_id:    (body.last_modified_user_id || 'ADMIN').slice(0, 5).toUpperCase(),
                tables: [{
                    table_name:      'GoodsReceiptHeader',
                    pk_field_names:  'material_doc_no',
                    pk_field_values: header.material_doc_no,
                    old_data:        {},
                    new_data:        header.toObject(),
                }],
            });
        } catch (auditErr) {
            console.error('Audit save failed (non-blocking):', auditErr);
        }

        return NextResponse.json(header, { status: 201 });
    } catch (error: any) {
        console.error('Error creating Goods Receipt Header:', error);

        if (error.code === 11000) {
            // Race condition: retry once with a fresh sequence
            try {
                const material_doc_no = await generateMaterialDocNo();
                const body = await request.json().catch(() => ({}));
                const header = new GoodsReceiptHeader({
                    ...body,
                    material_doc_no,
                    last_modified_user_id: 'ADMIN',
                    last_modified_date_time: new Date(),
                });
                await header.save();
                return NextResponse.json(header, { status: 201 });
            } catch {
                return NextResponse.json(
                    { error: 'Failed to generate unique Material Doc No. Please try again.' },
                    { status: 409 }
                );
            }
        }
        if (error.name === 'ValidationError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error.message },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: error.message || 'Failed to create Goods Receipt Header' },
            { status: 500 }
        );
    }
}