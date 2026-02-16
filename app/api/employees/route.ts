import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import EmployeeMaster from '@/server/models/EmployeeMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/employees - Get all employees
export async function GET() {
  try {
    await ensureConnection();
    // Use lean() for faster queries - returns plain JavaScript objects instead of Mongoose documents
    const employees = await EmployeeMaster.find().lean().sort({ emp_id: 1 });
    return NextResponse.json(employees, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Provide more detailed error information
    const errorMessage = error.message || 'Failed to fetch employees';
    const isDbError = error.message?.includes('Database') || 
                     error.message?.includes('MongoDB') || 
                     error.message?.includes('connection') ||
                     error.message?.includes('environment variable');
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: isDbError ? 'Database connection issue. Please check your Database environment variable.' : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/employees - Create new employee
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    const employee = new EmployeeMaster({ 
      ...body,
      active: body.active !== undefined ? body.active : true,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await employee.save();
    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Employee ID already exists' },
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
      { error: error.message || 'Failed to create employee' },
      { status: 500 }
    );
  }
}




