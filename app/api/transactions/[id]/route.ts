import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import TransactionTable from '@/server/models/TransactionTable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/transactions/[id] - Get specific transaction by batch_no
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureConnection();
    const transaction = await TransactionTable.findOne({ batch_no: params.id }).lean();
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(transaction);
  } catch (error: any) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}

// PUT /api/transactions/[id] - Update transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureConnection();
    const body = await request.json();
    
    // Validate month_year format if provided
    if (body.month_year && !/^\d{6}$/.test(body.month_year)) {
      return NextResponse.json(
        { error: 'Month-Year must be in YYYYMM format' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (body.current_batch_status_id) {
      const validStatuses = ['P', 'R', 'W', 'C'];
      if (!validStatuses.includes(body.current_batch_status_id)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be P, R, W, or C' },
          { status: 400 }
        );
      }
    }

    // Check for duplicates if changing batch_no or month_year
    if (body.batch_no || body.month_year) {
      const currentTransaction = await TransactionTable.findOne({ batch_no: params.id });
      
      if (currentTransaction) {
        const newBatchNo = body.batch_no || currentTransaction.batch_no;
        const newMonthYear = body.month_year || currentTransaction.month_year;
        
        // Check if another transaction already has this combination
        const existingTransaction = await TransactionTable.findOne({
          batch_no: newBatchNo,
          month_year: newMonthYear,
          _id: { $ne: currentTransaction._id }
        });
        
        if (existingTransaction) {
          return NextResponse.json(
            { error: `Batch number ${newBatchNo} already exists for ${newMonthYear}` },
            { status: 400 }
          );
        }
      }
    }

    const transaction = await TransactionTable.findOneAndUpdate(
      { batch_no: params.id },
      { 
        ...body,
        ...(body.product_id && { product_id: body.product_id.toUpperCase() }),
        ...(body.batch_no && { batch_no: body.batch_no.toUpperCase() }),
        ...(body.total_sachets && { total_sachets: Number(body.total_sachets) }),
        ...(body.total_sterilization_cartons && { total_sterilization_cartons: Number(body.total_sterilization_cartons) }),
        ...(body.total_shipper_cartons && { total_shipper_cartons: Number(body.total_shipper_cartons) }),
        ...(body.total_rejected_qty_kg && { total_rejected_qty_kg: Number(body.total_rejected_qty_kg) }),
        last_modified_date_time: new Date() 
      },
      { new: true, runValidators: true }
    );
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(transaction);
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Batch number already exists for this month' },
        { status: 400 }
      );
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/[id] - Delete transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureConnection();
    const transaction = await TransactionTable.findOneAndDelete({ batch_no: params.id });
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}

// PATCH /api/transactions/[id] - Partially update transaction
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureConnection();
    const body = await request.json();
    
    // Validate status if provided
    if (body.current_batch_status_id) {
      const validStatuses = ['P', 'R', 'W', 'C'];
      if (!validStatuses.includes(body.current_batch_status_id)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be P, R, W, or C' },
          { status: 400 }
        );
      }

      // Auto-set dates based on status changes
      const updateData: any = { 
        ...body,
        last_modified_date_time: new Date() 
      };
      
      // If status changing to Running and no actual_start_date, set it
      if (body.current_batch_status_id === 'R') {
        const currentTransaction = await TransactionTable.findOne({ batch_no: params.id });
        if (currentTransaction && !currentTransaction.actual_start_date) {
          updateData.actual_start_date = new Date();
        }
      }
      
      // If status changing to Completed and no actual_end_date, set it
      if (body.current_batch_status_id === 'C') {
        const currentTransaction = await TransactionTable.findOne({ batch_no: params.id });
        if (currentTransaction && !currentTransaction.actual_end_date) {
          updateData.actual_end_date = new Date();
        }
      }

      const transaction = await TransactionTable.findOneAndUpdate(
        { batch_no: params.id },
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!transaction) {
        return NextResponse.json(
          { error: 'Transaction not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(transaction);
    }

    // If no status update, just apply the partial update
    const transaction = await TransactionTable.findOneAndUpdate(
      { batch_no: params.id },
      { 
        ...body,
        last_modified_date_time: new Date() 
      },
      { new: true, runValidators: true }
    );
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(transaction);
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update transaction' },
      { status: 500 }
    );
  }
}