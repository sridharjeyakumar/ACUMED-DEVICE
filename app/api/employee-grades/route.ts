import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import EmployeeGradeMaster from '@/server/models/EmployeeGradeMaster';

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

// GET /api/employee-grades - Get all employee grades
export async function GET() {
  try {
    await ensureDbConnection();
    const grades = await EmployeeGradeMaster.find().sort({ grade_id: 1 });
    return NextResponse.json(grades);
  } catch (error: any) {
    console.error('Error fetching employee grades:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch employee grades' },
      { status: 500 }
    );
  }
}

// POST /api/employee-grades - Create new employee grade
export async function POST(request: NextRequest) {
  try {
    await ensureDbConnection();
    const body = await request.json();
    const grade = new EmployeeGradeMaster({ 
      grade_id: body.grade_id,
      grade_name: body.grade_name,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await grade.save();
    return NextResponse.json(grade, { status: 201 });
  } catch (error: any) {
    console.error('Error creating employee grade:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Grade ID already exists' },
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
      { error: error.message || 'Failed to create employee grade' },
      { status: 500 }
    );
  }
}

