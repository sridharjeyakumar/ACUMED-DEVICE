import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import EmployeeMaster from '@/server/models/EmployeeMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/employees/[id] - Get employee by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureConnection();
    const employee = await EmployeeMaster.findOne({ emp_id: params.id }).lean();
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(employee);
  } catch (error: any) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch employee' },
      { status: 500 }
    );
  }
}

// PUT /api/employees/[id] - Update employee
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const employee = await EmployeeMaster.findOneAndUpdate(
      { emp_id: params.id },
      {
        ...body,
        doj: body.doj ? parseDate(body.doj) : undefined,
        dol: body.dol ? parseDate(body.dol) : undefined,
        dob: body.dob ? parseDate(body.dob) : undefined,
        age: body.age ? Number(body.age) : undefined,
        married: body.married === true || body.married === 'TRUE' || body.married === 'true',
        last_modified_user_id: body.last_modified_user_id || 'ADMIN',
        last_modified_date_time: new Date(),
      },
      { new: true, runValidators: true }
    );
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(employee);
  } catch (error: any) {
    console.error('Error updating employee:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update employee' },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/[id] - Delete employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureConnection();
    const employee = await EmployeeMaster.findOneAndDelete({ emp_id: params.id });
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: 'Employee deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete employee' },
      { status: 500 }
    );
  }
}

