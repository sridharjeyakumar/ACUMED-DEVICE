import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import MachineEvent from '@/server/models/MachineEvent';
import MachineEventMaterial from '@/server/models/MachineEventMaterial';
import MachineStatus from '@/server/models/MachineStatus';
import BatchMaterialSummary from '@/server/models/BatchMaterialSummary';
import MachineEventTypeMaster from '@/server/models/MachineEventTypeMaster';
import GoodsReceiptUnits from '@/server/models/GoodsReceiptUnits';
import GoodsReceiptHeader from '@/server/models/GoodsReceiptHeader';
import TransactionTable from '@/server/models/TransactionTable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/machine-events - Get all machine events (optional filters: machine_id, batch_no)
export async function GET(request: NextRequest) {
  try {
    await ensureConnection();
    const { searchParams } = new URL(request.url);
    const machine_id = searchParams.get('machine_id');
    const batch_no = searchParams.get('batch_no');

    const query: any = {};
    if (machine_id) query.machine_id = machine_id.toUpperCase();
    if (batch_no) query.batch_no = batch_no.toUpperCase();

    const events = await MachineEvent.find(query).lean().sort({ machine_event_id: -1 });
    return NextResponse.json(events);
  } catch (error: any) {
    console.error('Error fetching machine events:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch machine events' },
      { status: 500 }
    );
  }
}

// POST /api/machine-events - Create new machine event (auto-generates machine_event_id)
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();

    // Auto-generate machine_event_id: find max and increment
    const lastEvent = await MachineEvent.findOne().sort({ machine_event_id: -1 }).lean();
    const nextId = lastEvent ? (lastEvent as any).machine_event_id + 1 : 2600001;

    // Count events for this batch to generate running serial (for display)
    const batchEventCount = await MachineEvent.countDocuments({ batch_no: body.batch_no?.toUpperCase() });

    const event = new MachineEvent({
      machine_event_id: nextId,
      machine_id: body.machine_id,
      batch_no: body.batch_no,
      product_id: body.product_id,
      machine_event_type_id: body.machine_event_type_id,
      event_date: body.event_date || new Date(),
      event_time: body.event_time,
      batch_status_id: body.batch_status_id || '',
      machine_stop_reason_id: body.machine_stop_reason_id || '',
      remarks: body.remarks || '',
      done_by_emp_id: body.done_by_emp_id || '',
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });

    await event.save();

    // Step 1: Update TransactionTable.current_batch_event_type_id for this batch
    if (body.batch_no && body.machine_event_type_id) {
      await TransactionTable.findOneAndUpdate(
        { batch_no: body.batch_no.toUpperCase() },
        { $set: { current_batch_event_type_id: body.machine_event_type_id.toUpperCase() } }
      );
    }

    // Save material record if material data is present
    if (body.material_id && body.roll_no) {
      const material = new MachineEventMaterial({
        machine_event_id: nextId,
        machine_id: body.machine_id,
        material_id: body.material_id,
        roll_no: body.roll_no,
        actual_open_qty: body.actual_open_qty != null ? Number(body.actual_open_qty) : undefined,
        actual_close_qty: body.actual_close_qty != null ? Number(body.actual_close_qty) : undefined,
        actual_consumed_qty: body.actual_consumed_qty != null ? Number(body.actual_consumed_qty) : undefined,
        uom: body.uom || undefined,
      });
      await material.save();

      // Fetch event type master once for both open/close qty checks
      const eventTypeMaster = await MachineEventTypeMaster.findOne({
        machine_event_type_id: body.machine_event_type_id?.toUpperCase(),
      }).lean();

      // Update GoodsReceiptUnits if event type accepts open qty and actual_open_qty > 0
      if (
        eventTypeMaster &&
        (eventTypeMaster as any).accept_open_qty === 'Y' &&
        Number(body.actual_open_qty) > 0
      ) {
        await GoodsReceiptUnits.findOneAndUpdate(
          {
            material_id: body.material_id.toUpperCase(),
            roll_no: body.roll_no,
          },
          {
            $set: {
              actual_qty: Number(body.actual_open_qty),
              status: 'I',
            },
          }
        );
      }

      // Step 2 & 3: Update GoodsReceiptUnits if event type accepts close qty
      if (
        eventTypeMaster &&
        (eventTypeMaster as any).accept_close_qty === 'Y'
      ) {
        const closeQty = Number(body.actual_close_qty);
        const updateOp: any = {
          $inc: { consumed_qty: Number(body.actual_consumed_qty) },
        };
        if (closeQty === 0) {
          // Step 2: actual_close_qty = 0 → zero out balance and close this roll
          updateOp.$set = { balance_qty: 0, status: 'C' };
        }
        const updatedGRU = await GoodsReceiptUnits.findOneAndUpdate(
          {
            material_id: body.material_id.toUpperCase(),
            roll_no: body.roll_no,
          },
          updateOp,
          { new: true }
        ).lean();

        // Step 3: If this roll is now closed, check if all rolls on the same material doc are closed
        if (closeQty === 0 && updatedGRU && (updatedGRU as any).material_doc_no) {
          const materialDocNo = (updatedGRU as any).material_doc_no;
          const openCount = await GoodsReceiptUnits.countDocuments({
            material_doc_no: materialDocNo,
            status: { $ne: 'C' },
          });
          if (openCount === 0) {
            await GoodsReceiptHeader.findOneAndUpdate(
              { material_doc_no: materialDocNo },
              { $set: { status: 'C' } }
            );
          }
        }
      }
    }

    // Upsert BatchMaterialSummary — accumulate consumed qty per batch+product+material
    if (body.material_id && body.batch_no && body.product_id) {
      const consumedQty = body.actual_consumed_qty != null ? Number(body.actual_consumed_qty) : 0;
      await BatchMaterialSummary.findOneAndUpdate(
        {
          batch_no:    body.batch_no.toUpperCase(),
          product_id:  body.product_id.toUpperCase(),
          material_id: body.material_id.toUpperCase(),
        },
        {
          $inc: {
            total_consumed_qty: consumedQty,
            total_no_of_rolls:  1,   // increment on every save
          },
          $set: {
            uom: body.uom || '',
            last_modified_user_id: body.last_modified_user_id || 'ADMIN',
            last_modified_date_time: new Date(),
          },
          $setOnInsert: {
            batch_no:   body.batch_no.toUpperCase(),
            product_id: body.product_id.toUpperCase(),
            material_id: body.material_id.toUpperCase(),
          },
        },
        { upsert: true, new: true }
      );
    }

    // Upsert MachineStatus — always overwrite previous data for the same machine_id
    await MachineStatus.findOneAndUpdate(
      { machine_id: body.machine_id?.toUpperCase() },
      {
        $set: {
          batch_no: body.batch_no?.toUpperCase(),
          product_id: body.product_id?.toUpperCase(),
          last_machine_event_id: event.machine_event_id,
          last_machine_event_type_id: body.machine_event_type_id?.toUpperCase(),
          material_id: body.material_id ? body.material_id.toUpperCase() : null,
          last_event_date: body.event_date || new Date(),
          last_event_time: body.event_time,
          last_modified_user_id: body.last_modified_user_id || 'ADMIN',
          last_modified_date_time: new Date(),
        },
        $setOnInsert: {
          machine_id: body.machine_id?.toUpperCase(),
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ ...event.toObject(), batch_serial: batchEventCount + 1 }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating machine event:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Machine Event ID already exists' }, { status: 400 });
    }
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create machine event' },
      { status: 500 }
    );
  }
}
