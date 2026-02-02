import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import HolidaysMaster from '@/server/models/HolidaysMaster';

let dbConnected = false;

async function ensureDbConnection() {
  const mongoose = await import('mongoose');
  const readyState = mongoose.default.connection.readyState as number;
  if (readyState === 1) {
    dbConnected = true;
    return;
  }
  
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
    if (readyState !== 1) {
      dbConnected = false;
      await ensureDbConnection();
    }
  }
}

// GET /api/holidays - Get all holidays
export async function GET() {
  try {
    await ensureDbConnection();
    const holidays = await HolidaysMaster.find().sort({ date: 1, year: 1 });
    return NextResponse.json(holidays);
  } catch (error: any) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch holidays' },
      { status: 500 }
    );
  }
}

// POST /api/holidays - Create new holiday
export async function POST(request: NextRequest) {
  try {
    await ensureDbConnection();
    const body = await request.json();
    const holiday = new HolidaysMaster({ 
      date: new Date(body.date),
      remarks: body.remarks,
      year: body.year,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await holiday.save();
    return NextResponse.json(holiday, { status: 201 });
  } catch (error: any) {
    console.error('Error creating holiday:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Holiday with this date and year already exists' },
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
      { error: error.message || 'Failed to create holiday' },
      { status: 500 }
    );
  }
}

