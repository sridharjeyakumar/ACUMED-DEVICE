import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import MaterialStocks from '@/server/models/MaterialStocks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/material-stocks/[id]
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await ensureConnection();

        const stock = await MaterialStocks.findOne({
            material_id: params.id.trim().toUpperCase(),
        }).lean();

        if (!stock) {
            return NextResponse.json(
                { error: `Stock not found for material '${params.id}'.` },
                { status: 404 }
            );
        }

        return NextResponse.json(stock);

    } catch (error: any) {
        console.error(`GET /material-stocks/${params.id} error:`, error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch stock' },
            { status: 500 }
        );
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/material-stocks/[id]
// UPSERT — creates the record if it doesn't exist, updates if it does.
// Conflict-free: $set handles all writable fields, $setOnInsert only sets
// material_id (the PK) which is never in $set.
// ─────────────────────────────────────────────────────────────────────────────
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await ensureConnection();
        const body = await request.json();

        const errors: string[] = [];
        if (body.current_stock_qty != null && isNaN(Number(body.current_stock_qty)))
            errors.push('current_stock_qty must be a number.');
        if (body.total_no_of_rolls != null && isNaN(Number(body.total_no_of_rolls)))
            errors.push('total_no_of_rolls must be a number.');
        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(' | ') }, { status: 422 });
        }

        const material_id = params.id.trim().toUpperCase();

        // ── $set: all updatable fields (applied on both insert & update) ─────
        const $set: Record<string, any> = {
            last_modified_date_time:  new Date(),
            last_modified_user_id:    body.last_modified_user_id?.trim().toUpperCase() || 'ADMIN',
            // uom is required — use provided value or fallback 'KG' for new records
            uom: body.uom?.trim().toUpperCase() || 'KG',
        };
        if (body.current_stock_qty != null) $set.current_stock_qty = Number(body.current_stock_qty);
        if (body.total_no_of_rolls != null) $set.total_no_of_rolls = Number(body.total_no_of_rolls);

        // ── $setOnInsert: only material_id (PK) — never conflicts with $set ──
        const $setOnInsert = { material_id };

        const stock = await MaterialStocks.findOneAndUpdate(
            { material_id },
            { $set, $setOnInsert },
            {
                new:                true,   // return the updated/inserted doc
                upsert:             true,   // CREATE if not found
                runValidators:      true,
                setDefaultsOnInsert: true,
            }
        ).lean();

        return NextResponse.json(stock);

    } catch (error: any) {
        console.error(`PUT /material-stocks/${params.id} error:`, error);
        if (error.name === 'ValidationError') {
            return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 400 });
        }
        return NextResponse.json(
            { error: error.message || 'Failed to upsert stock' },
            { status: 500 }
        );
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/material-stocks/[id]
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await ensureConnection();

        const stock = await MaterialStocks.findOneAndDelete({
            material_id: params.id.trim().toUpperCase(),
        }).lean();

        if (!stock) {
            return NextResponse.json(
                { error: `Stock not found for material '${params.id}'.` },
                { status: 404 }
            );
        }

        return NextResponse.json({ deleted: 1, material_id: params.id.toUpperCase() });

    } catch (error: any) {
        console.error(`DELETE /material-stocks/${params.id} error:`, error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete stock' },
            { status: 500 }
        );
    }
}