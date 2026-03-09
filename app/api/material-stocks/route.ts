import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import MaterialStocks from '@/server/models/MaterialStocks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/material-stocks
//   ?material_id=XX001  → stock for one material
//   (no query param)    → all stocks
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
    try {
        await ensureConnection();

        const { searchParams } = new URL(request.url);
        const material_id = searchParams.get('material_id');

        if (material_id) {
            const stock = await MaterialStocks.findOne({
                material_id: material_id.trim().toUpperCase(),
            }).lean();

            if (!stock) {
                return NextResponse.json(
                    { error: `No stock record found for material '${material_id}'.` },
                    { status: 404 }
                );
            }
            return NextResponse.json(stock);
        }

        const stocks = await MaterialStocks.find().lean().sort({ material_id: 1 });
        return NextResponse.json(stocks);

    } catch (error: any) {
        console.error('GET /material-stocks error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch material stocks' },
            { status: 500 }
        );
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/material-stocks
// Body: material_id, current_stock_qty, uom, total_no_of_rolls, last_modified_user_id
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        await ensureConnection();
        const body = await request.json();

        const errors: string[] = [];
        if (!body.material_id?.trim())          errors.push('material_id is required.');
        if (!body.uom?.trim())                   errors.push('uom is required.');
        if (body.current_stock_qty == null || isNaN(Number(body.current_stock_qty)))
            errors.push('current_stock_qty is required and must be a number.');
        if (body.total_no_of_rolls == null || isNaN(Number(body.total_no_of_rolls)))
            errors.push('total_no_of_rolls is required and must be a number.');
        if (!body.last_modified_user_id?.trim()) errors.push('last_modified_user_id is required.');

        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(' | ') }, { status: 422 });
        }

        const existing = await MaterialStocks.findOne({
            material_id: body.material_id.trim().toUpperCase(),
        }).lean();
        if (existing) {
            return NextResponse.json(
                { error: `Stock record for material '${body.material_id}' already exists.` },
                { status: 409 }
            );
        }

        const stock = new MaterialStocks({
            material_id:              body.material_id.trim().toUpperCase(),
            current_stock_qty:        Number(body.current_stock_qty),
            uom:                      body.uom.trim().toUpperCase(),
            total_no_of_rolls:        Number(body.total_no_of_rolls),
            last_modified_user_id:    body.last_modified_user_id.trim().toUpperCase(),
            last_modified_date_time:  new Date(),
        });

        await stock.save();
        return NextResponse.json(stock, { status: 201 });

    } catch (error: any) {
        console.error('POST /material-stocks error:', error);
        if (error.code === 11000) {
            return NextResponse.json(
                { error: 'Duplicate stock record. This material already has a stock entry.' },
                { status: 409 }
            );
        }
        if (error.name === 'ValidationError') {
            return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 400 });
        }
        return NextResponse.json(
            { error: error.message || 'Failed to create material stock' },
            { status: 500 }
        );
    }
}