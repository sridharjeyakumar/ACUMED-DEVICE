import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import Packing from '@/server/models/Packing';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

let dbConnected = false;

async function ensureDbConnection() {
  const readyState = mongoose.connection.readyState;
  
  // If already connected, return
  if (readyState === mongoose.ConnectionStates.connected) {
    dbConnected = true;
    return;
  }
  
  // If not connected, try to connect
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (error: any) {
      dbConnected = false;
      console.error('Database connection error:', error);
      throw error;
    }
  } else {
    // If dbConnected is true but connection state is not connected, 
    // reset dbConnected and try again recursively
    dbConnected = false;
    await ensureDbConnection();
  }
}

// GET /api/packing-entry - Get all packing records
export async function GET(request: NextRequest) {
  try {
    await ensureDbConnection();
    const records = await (Packing as any).find().sort({ packing_id: -1 });
    return NextResponse.json(records);
  } catch (error: any) {
    console.error('Error fetching packing records:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch packing records' },
      { status: 500 }
    );
  }
}

// Generate Packing ID function
async function generatePackingId(): Promise<number> {
    try {
        // Get current year in YY format (e.g., 2024 -> 24)
        const currentYear = new Date().getFullYear();
        const yearCode = currentYear.toString().slice(-2);
        
        // Packing ID format: YY + 5-digit sequential number (e.g., 2400001)
        const yearPrefix = parseInt(yearCode) * 100000; // 24 -> 2400000
        
        // Use type assertion to avoid TypeScript error
        const lastRecord = await (Packing as any).findOne({
            packing_id: { $gte: yearPrefix, $lt: yearPrefix + 100000 }
        }).sort({ packing_id: -1 });
        
        let nextSequence = 1;
        
        if (lastRecord) {
            // Extract the sequence number from the last packing_id
            const lastSequence = lastRecord.packing_id % 100000;
            nextSequence = lastSequence + 1;
        }
        
        // Generate new packing_id: YY + 5-digit sequence (padded with zeros)
        const newPackingId = yearPrefix + nextSequence;
        
        return newPackingId;
    } catch (error) {
        console.error('Error generating packing ID:', error);
        throw new Error('Failed to generate packing ID');
    }
}

// POST /api/packing-entry - Create a new packing record
export async function POST(request: NextRequest) {
  try {
    await ensureDbConnection();
    const body = await request.json();
    
    // Generate new packing_id
    const packing_id = await generatePackingId();

    // Safety check for race condition - use type assertion
    const existingRecord = await (Packing as any).findOne({ packing_id });
    if (existingRecord) {
      return NextResponse.json(
        { error: 'Packing ID generation failed. Please try again.' },
        { status: 409 }
      );
    }

    const packingData = {
      packing_id,
      packing_date: body.packing_date,
      batch_no: body.batch_no,
      product_id: body.product_id,
      packsize_id: body.packsize_id,
      no_of_packs: body.no_of_packs || 0,
      no_of_sachets: body.no_of_sachets || 0,
      total_machine_time_in_min: body.total_machine_time_in_min || 0,
      remarks: body.remarks || '',
      entered_by_user_id: body.entered_by_user_id || 'ADMIN',
      entered_date_time: new Date(),
      approval_remarks: '',
      approved_by_user_id: '',
      approved_date_time: null,
      status: 'E',
    };

    const record = await (Packing as any).create(packingData);
    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    console.error('Error creating packing record:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create packing record' },
      { status: 500 }
    );
  }
}