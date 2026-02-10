import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import EmployeeMaster from '@/server/models/EmployeeMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/employees - Get all employees
export async function GET() {
  try {
    await ensureConnection();
    // Use lean() for faster queries
    const employees = await EmployeeMaster.find().lean().sort({ emp_id: 1 });
    return NextResponse.json(employees, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// POST /api/employees - Create new employee
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    
    // Parse dates if provided
    const parseDate = (dateStr: string | undefined) => {
      if (!dateStr) return undefined;
      // Handle DD-MM-YYYY format
      if (dateStr.includes('-') && dateStr.length === 10) {
        const [day, month, year] = dateStr.split('-');
        return new Date(`${year}-${month}-${day}`);
      }
      return new Date(dateStr);
    };

    const employee = new EmployeeMaster({ 
      ...body,
      doj: body.doj ? parseDate(body.doj) : undefined,
      dol: body.dol ? parseDate(body.dol) : undefined,
      dob: body.dob ? parseDate(body.dob) : undefined,
      age: body.age ? Number(body.age) : undefined,
      married: body.married === true || body.married === 'TRUE' || body.married === 'true',
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

