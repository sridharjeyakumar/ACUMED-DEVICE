import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import DepartmentMaster from '@/server/models/DepartmentMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/departments - Get all departments
export async function GET() {
  try {
    await ensureConnection();
    // Use lean() for faster queries
    const departments = await DepartmentMaster.find().lean().sort({ dept_id: 1 });
    return NextResponse.json(departments, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

// POST /api/departments - Create new department
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    const department = new DepartmentMaster({ 
      dept_id: body.dept_id,
      department_name: body.department_name,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await department.save();
    return NextResponse.json(department, { status: 201 });
  } catch (error: any) {
    console.error('Error creating department:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Department ID already exists' },
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
      { error: error.message || 'Failed to create department' },
      { status: 500 }
    );
  }
}



