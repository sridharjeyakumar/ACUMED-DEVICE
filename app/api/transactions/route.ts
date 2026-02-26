import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import TransactionTable from '@/server/models/TransactionTable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/transactions - Get all transactions
export async function GET() {
  try {
    await ensureConnection();
    const transactions = await TransactionTable.find()
      .lean()
      .sort({ batch_no: 1 });
    
    return NextResponse.json(transactions, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create new transaction
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    
    console.log('Received data:', body); // Debug log
    
    // Log what we're checking
    console.log('Checking for existing transaction with:', { 
      batch_no: body.batch_no, 
      month_year: body.month_year 
    });
    
    // Check if the SAME batch number for the SAME month already exists
    const existingTransaction = await TransactionTable.findOne({ 
      batch_no: body.batch_no,
      month_year: body.month_year
    });
    
    console.log('Existing transaction found:', existingTransaction); // Debug log
    
    if (existingTransaction) {
      return NextResponse.json(
        { error: `Batch number ${body.batch_no} already exists for ${body.month_year}` },
        { status: 400 }
      );
    }

    // Check if there are ANY transactions with this batch_no (for debugging)
    const anyBatchExists = await TransactionTable.findOne({ batch_no: body.batch_no });
    console.log('Any transaction with this batch_no:', anyBatchExists);
    
    // Check if there are ANY transactions with this month_year (for debugging)
    const anyMonthExists = await TransactionTable.findOne({ month_year: body.month_year });
    console.log('Any transaction with this month_year:', anyMonthExists);

    // Validate month_year format (YYYYMM)
    if (!/^\d{6}$/.test(body.month_year)) {
      return NextResponse.json(
        { error: 'Month-Year must be in YYYYMM format' },
        { status: 400 }
      );
    }

    // Validate max lengths
    if (body.batch_no && body.batch_no.length > 6) {
      return NextResponse.json(
        { error: 'Batch number must not exceed 6 characters' },
        { status: 400 }
      );
    }

    if (body.product_id && body.product_id.length > 5) {
      return NextResponse.json(
        { error: 'Product ID must not exceed 5 characters' },
        { status: 400 }
      );
    }

    if (body.current_batch_event_type_id && body.current_batch_event_type_id.length > 2) {
      return NextResponse.json(
        { error: 'Event Type ID must not exceed 2 characters' },
        { status: 400 }
      );
    }

    if (body.remarks && body.remarks.length > 100) {
      return NextResponse.json(
        { error: 'Remarks must not exceed 100 characters' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['P', 'R', 'W', 'C'];
    if (!validStatuses.includes(body.current_batch_status_id)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be P, R, W, or C' },
        { status: 400 }
      );
    }

    // Convert string numbers to actual numbers
    const transactionData = {
      ...body,
      batch_no: body.batch_no.toUpperCase(),
      product_id: body.product_id.toUpperCase(),
      total_sachets: body.total_sachets ? Number(body.total_sachets) : undefined,
      total_sterilization_cartons: body.total_sterilization_cartons ? Number(body.total_sterilization_cartons) : undefined,
      total_shipper_cartons: body.total_shipper_cartons ? Number(body.total_shipper_cartons) : undefined,
      total_rejected_qty_kg: body.total_rejected_qty_kg ? Number(body.total_rejected_qty_kg) : undefined,
      last_modified_date_time: new Date(),
    };

    const transaction = new TransactionTable(transactionData);
    await transaction.save();
    
    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Batch number already exists for this month' },
        { status: 400 }
      );
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create transaction' },
      { status: 500 }
    );
  }
}