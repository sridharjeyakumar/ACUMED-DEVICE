import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import EmployeeMaster from '@/server/models/EmployeeMaster';
import { safeNumber } from '@/utils/numberUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/employees/[id] - Get employee by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureConnection();
    const { id } = await params;
    const employee = await EmployeeMaster.findOne({ emp_id: id }).lean();
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureConnection();
    const { id } = await params;
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

    // Remove emp_id from update data to prevent changing it
    const { emp_id, ...updateBody } = body;

    const updateData: any = {
      ...updateBody,
      // Convert empty strings to undefined for optional fields
      location: updateBody.location || undefined,
      dept_id: updateBody.dept_id || undefined,
      grade_id: updateBody.grade_id || undefined,
      team: updateBody.team || undefined,
      category: updateBody.category || undefined,
      pf_no: updateBody.pf_no || undefined,
      esi_no: updateBody.esi_no || undefined,
      remarks: updateBody.remarks || undefined,
      address: updateBody.address || undefined,
      mobile_no: updateBody.mobile_no || undefined,
      blood_group: updateBody.blood_group || undefined,
      education: updateBody.education || undefined,
      emp_photo: updateBody.emp_photo || undefined,
      
      // Parse dates
      doj: updateBody.doj ? parseDate(updateBody.doj) : undefined,
      dol: updateBody.dol ? parseDate(updateBody.dol) : undefined,
      dob: updateBody.dob ? parseDate(updateBody.dob) : undefined,
      
      // Convert to Number
      age: safeNumber(updateBody.age) || undefined,
      
      // Convert to Boolean
      married: updateBody.married === true || updateBody.married === 'TRUE' || updateBody.married === 'true',
      active: updateBody.active !== undefined ? (updateBody.active === true || updateBody.active === 'true') : true,
      
      last_modified_user_id: updateBody.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    };

    const employee = await EmployeeMaster.findOneAndUpdate(
      { emp_id: id },
      { $set: updateData },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureConnection();
    const { id } = await params;
    const employee = await EmployeeMaster.findOneAndDelete({ emp_id: id });
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

