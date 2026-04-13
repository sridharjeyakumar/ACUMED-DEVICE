import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import PurchaseOrder from '@/server/models/PurchaseOrder';
import PurchaseOrderDetail from '@/server/models/PurchaseOrderDetail';
import { saveAudit } from '@/server/lib/AuditService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function ensureDbConnection() {
  try {
    await ensureConnection();
  } catch (error: any) {
    console.error('Database connection error:', error);
    throw new Error('Database connection failed');
  }
}

// GET /api/purchase-orders/[id] - Get purchase order by PO No
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json({ error: 'PO No is required' }, { status: 400 });
    }

    await ensureDbConnection();
    const order = await PurchaseOrder.findOne({ po_no: id }).lean();
    if (!order) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error fetching purchase order:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch purchase order',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// PUT /api/purchase-orders/[id] - Update purchase order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json({ error: 'PO No is required' }, { status: 400 });
    }

    await ensureDbConnection();
    const body = await request.json();

    const existing = await PurchaseOrder.findOne({ po_no: id }).lean();
    if (!existing) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    const cleanValue = (value: any) => (value === '' || value === null) ? undefined : value;

    const updateData: any = {};

    if (body.po_date !== undefined) updateData.po_date = body.po_date ? new Date(body.po_date) : undefined;
    if (body.po_time !== undefined) updateData.po_time = body.po_time;
    if (body.vendor_id !== undefined) updateData.vendor_id = body.vendor_id;
    if (body.vendor_ref_doc_no !== undefined) updateData.vendor_ref_doc_no = cleanValue(body.vendor_ref_doc_no);
    if (body.vendor_ref_doc_date !== undefined) updateData.vendor_ref_doc_date = body.vendor_ref_doc_date ? new Date(body.vendor_ref_doc_date) : undefined;
    if (body.delivery_text !== undefined) updateData.delivery_text = cleanValue(body.delivery_text);
    if (body.shipping_instruction !== undefined) updateData.shipping_instruction = body.shipping_instruction ? new Date(body.shipping_instruction) : undefined;
    if (body.terms_of_payment !== undefined) updateData.terms_of_payment = cleanValue(body.terms_of_payment);
    if (body.remarks !== undefined) updateData.remarks = cleanValue(body.remarks);
    if (body.approval_remarks !== undefined) updateData.approval_remarks = cleanValue(body.approval_remarks);
    if (body.approved_by_user_id !== undefined) updateData.approved_by_user_id = cleanValue(body.approved_by_user_id);
    if (body.approved_date_time !== undefined) updateData.approved_date_time = body.approved_date_time ? new Date(body.approved_date_time) : undefined;
    if (body.status !== undefined) updateData.status = body.status;

    const order = await PurchaseOrder.findOneAndUpdate(
      { po_no: id },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!order) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    // ── Audit Trail ──────────────────────────────────────────────────────────
    try {
      await saveAudit({
        menu_id:           'T11',
        header_table_name: 'PurchaseOrder',
        documnet_no:       id,
        change_user_id:    (body.approved_by_user_id || (existing as any).entered_by_user_id || 'ADMIN').slice(0, 5).toUpperCase(),
        tables: [{
          table_name:      'PurchaseOrder',
          pk_field_names:  'po_no',
          pk_field_values: id,
          old_data:        existing as any,
          new_data:        updateData,
        }],
      });
    } catch (auditErr) {
      console.error('Audit save failed (non-blocking):', auditErr);
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error updating purchase order:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: error.message || 'Failed to update purchase order',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/purchase-orders/[id] - Delete purchase order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json({ error: 'PO No is required' }, { status: 400 });
    }

    await ensureDbConnection();
    const order = await PurchaseOrder.findOneAndDelete({ po_no: id });

    if (!order) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    // Cascade delete all detail rows for this PO
    await PurchaseOrderDetail.deleteMany({ po_no: id });

    return NextResponse.json({ message: 'Purchase order deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting purchase order:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to delete purchase order',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
