import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import EmployeeGradeMaster from '@/server/models/EmployeeGradeMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

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

// GET /api/employee-grades/[id] - Get employee grade by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const grade = await EmployeeGradeMaster.findOne({ grade_id: id });
    if (!grade) {
      return NextResponse.json({ error: 'Employee grade not found' }, { status: 404 });
    }
    return NextResponse.json(grade);
  } catch (error: any) {
    console.error('Error fetching employee grade:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch employee grade' },
      { status: 500 }
    );
  }
}

// PUT /api/employee-grades/[id] - Update employee grade
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const body = await request.json();
    
    const updateData: any = {};
    if (body.grade_name !== undefined) updateData.grade_name = body.grade_name;
    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();
    
    const grade = await EmployeeGradeMaster.findOneAndUpdate(
      { grade_id: id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!grade) {
      return NextResponse.json({ error: 'Employee grade not found' }, { status: 404 });
    }
    return NextResponse.json(grade);
  } catch (error: any) {
    console.error('Error updating employee grade:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update employee grade' },
      { status: 500 }
    );
  }
}

// DELETE /api/employee-grades/[id] - Delete employee grade
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const grade = await EmployeeGradeMaster.findOneAndDelete({ grade_id: id });
    if (!grade) {
      return NextResponse.json({ error: 'Employee grade not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Employee grade deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting employee grade:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete employee grade' },
      { status: 500 }
    );
  }
}

