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
import MaterialStocks from '@/server/models/MaterialStocks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/machine-events
export async function GET(request: NextRequest) {
  try {
    await ensureConnection();
    const { searchParams } = new URL(request.url);
    const machine_id = searchParams.get('machine_id');
    const batch_no   = searchParams.get('batch_no');

    const query: any = {};
    if (machine_id) query.machine_id = machine_id.toUpperCase();
    if (batch_no)   query.batch_no   = batch_no.toUpperCase();

    const events = await MachineEvent.find(query).lean().sort({ machine_event_id: -1 });
    return NextResponse.json(events);
  } catch (error: any) {
    console.error('Error fetching machine events:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch machine events' }, { status: 500 });
  }
}

// POST /api/machine-events
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();

    const machineId        = body.machine_id?.toUpperCase();
    const batchNo          = body.batch_no?.toUpperCase();
    const eventTypeId      = body.machine_event_type_id?.toUpperCase();
    const materialId       = body.material_id?.toUpperCase();
    const rollNo           = body.roll_no;
    const actualOpenQty    = body.actual_open_qty  != null ? Number(body.actual_open_qty)  : 0;
    const actualCloseQty   = body.actual_close_qty != null ? Number(body.actual_close_qty) : 0;
    const actualConsumedQty = body.actual_consumed_qty != null ? Number(body.actual_consumed_qty) : 0;

    // ── Auto-generate machine_event_id ──────────────────────────────────────
    const lastEvent = await MachineEvent.findOne().sort({ machine_event_id: -1 }).lean();
    const nextId    = lastEvent ? (lastEvent as any).machine_event_id + 1 : 2600001;
    const batchEventCount = await MachineEvent.countDocuments({ batch_no: batchNo });

    // ── Step 1: Add record in MachineEvent (header) ─────────────────────────
    const event = new MachineEvent({
      machine_event_id:       nextId,
      machine_id:             machineId,
      batch_no:               batchNo,
      product_id:             body.product_id,
      machine_event_type_id:  eventTypeId,
      event_date:             body.event_date || new Date(),
      event_time:             body.event_time,
      batch_status_id:        body.batch_status_id        || '',
      machine_stop_reason_id: body.machine_stop_reason_id || '',
      remarks:                body.remarks                || '',
      done_by_emp_id:         body.done_by_emp_id         || '',
      last_modified_user_id:  body.last_modified_user_id  || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await event.save();

    // ── Step 2: Add record in MachineEventMaterial (when material present) ──
    if (materialId && rollNo) {
      const material = new MachineEventMaterial({
        machine_event_id:   nextId,
        machine_id:         machineId,
        material_id:        materialId,
        roll_no:            rollNo,
        actual_open_qty:    actualOpenQty    || undefined,
        actual_close_qty:   actualCloseQty   || undefined,
        actual_consumed_qty: actualConsumedQty || undefined,
        uom:                body.uom          || undefined,
      });
      await material.save();
    }

    // ── Step 3: Upsert MachineStatus ────────────────────────────────────────
    await MachineStatus.findOneAndUpdate(
      { machine_id: machineId },
      {
        $set: {
          batch_no:                   batchNo,
          product_id:                 body.product_id?.toUpperCase(),
          last_machine_event_id:      nextId,
          last_machine_event_type_id: eventTypeId,
          material_id:                materialId || null,
          last_event_date:            body.event_date || new Date(),
          last_event_time:            body.event_time,
          last_modified_user_id:      body.last_modified_user_id || 'ADMIN',
          last_modified_date_time:    new Date(),
        },
        $setOnInsert: { machine_id: machineId },
      },
      { upsert: true, new: true }
    );

    // ── Step 4: Update BatchMaterialSummary ─────────────────────────────────
    if (materialId && batchNo && body.product_id) {
      await BatchMaterialSummary.findOneAndUpdate(
        { batch_no: batchNo, product_id: body.product_id.toUpperCase(), material_id: materialId },
        {
          $inc: { total_consumed_qty: actualConsumedQty, total_no_of_rolls: 1 },
          $set: {
            uom: body.uom || '',
            last_modified_user_id:   body.last_modified_user_id || 'ADMIN',
            last_modified_date_time: new Date(),
          },
          $setOnInsert: {
            batch_no:    batchNo,
            product_id:  body.product_id.toUpperCase(),
            material_id: materialId,
          },
        },
        { upsert: true, new: true }
      );
    }

    // ── Step 5: Update TransactionTable.current_batch_event_type_id ─────────
    // ── Step 6: If NB → set current_batch_status_id = 'W' ──────────────────
    if (batchNo && eventTypeId) {
      const transUpdate: any = { current_batch_event_type_id: eventTypeId };
      if (eventTypeId === 'NB') {
        transUpdate.current_batch_status_id = 'W';
      }
      await TransactionTable.findOneAndUpdate(
        { batch_no: batchNo },
        { $set: transUpdate }
      );
    }

    // ── Steps 7–9: Conditional GRU + MaterialStocks updates ─────────────────
    if (materialId && rollNo) {
      const eventTypeMaster = await MachineEventTypeMaster.findOne({ machine_event_type_id: eventTypeId }).lean();

      // ── Step 7–9: accept_open_qty = 'Y' AND actual_open_qty > 0 ────────────
      if (eventTypeMaster && (eventTypeMaster as any).accept_open_qty === 'Y' && actualOpenQty > 0) {
        // Check GRU status = 'A' before proceeding
        const gru = await GoodsReceiptUnits.findOne({ material_id: materialId, roll_no: rollNo, status: 'A' }).lean();

        if (gru) {
          // Step 8: Update GRU actual_qty = actual_open_qty, status = 'I'
          await GoodsReceiptUnits.findOneAndUpdate(
            { material_id: materialId, roll_no: rollNo },
            { $set: { actual_qty: actualOpenQty, status: 'I' } }
          );

          // Step 9: Update MaterialStocks: current_stock_qty -= nett_qty, total_no_of_rolls -= 1
          await MaterialStocks.findOneAndUpdate(
            { material_id: materialId },
            { $inc: { current_stock_qty: -(gru as any).nett_qty, total_no_of_rolls: -1 } }
          );
        }
      }

      // ── Step 10: accept_close_qty = 'Y' ────────────────────────────────────
      if (eventTypeMaster && (eventTypeMaster as any).accept_close_qty === 'Y') {
        const setOp: any = { status: 'A' };
        if (actualCloseQty === 0) {
          setOp.balance_qty = 0;
          setOp.status = 'C';
        }

        const updatedGRU = await GoodsReceiptUnits.findOneAndUpdate(
          { material_id: materialId, roll_no: rollNo },
          { $inc: { consumed_qty: actualConsumedQty }, $set: setOp },
          { new: true }
        ).lean();

        // If roll is now closed, check if all rolls of the same material doc are closed
        if (actualCloseQty === 0 && updatedGRU && (updatedGRU as any).material_doc_no) {
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

    return NextResponse.json({ ...event.toObject(), batch_serial: batchEventCount + 1 }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating machine event:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Machine Event ID already exists' }, { status: 400 });
    }
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create machine event' }, { status: 500 });
  }
}
