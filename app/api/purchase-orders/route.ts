import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import PurchaseOrder from '@/server/models/PurchaseOrder';
import { saveAudit } from '@/server/lib/AuditService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/purchase-orders - Get all purchase orders
export async function GET() {
  try {
    await ensureConnection();
    const orders = await PurchaseOrder.find().lean().sort({ po_no: -1 });
    return NextResponse.json(orders, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch purchase orders' },
      { status: 500 }
    );
  }
}

// POST /api/purchase-orders - Create new purchase order
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();

    const order = new PurchaseOrder({
      ...body,
      po_date: body.po_date ? new Date(body.po_date) : new Date(),
      vendor_ref_doc_date: body.vendor_ref_doc_date ? new Date(body.vendor_ref_doc_date) : undefined,
      shipping_instruction: body.shipping_instruction,
      entered_date_time: new Date(),
      status: body.status || 'E',
    });

    await order.save();

    // ── Audit Trail ──────────────────────────────────────────────────────────
    try {
      await saveAudit({
        menu_id:           'T11',
        header_table_name: 'PurchaseOrder',
        documnet_no:       order.po_no,
        change_user_id:    (body.entered_by_user_id || 'ADMIN').slice(0, 5).toUpperCase(),
        tables: [{
          table_name:      'PurchaseOrder',
          pk_field_names:  'po_no',
          pk_field_values: order.po_no,
          old_data:        {},
          new_data:        order.toObject(),
        }],
      });
    } catch (auditErr) {
      console.error('Audit save failed (non-blocking):', auditErr);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error('Error creating purchase order:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'PO number already exists' },
        { status: 400 }
      );
    }
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create purchase order' },
      { status: 500 }
    );
  }
}
