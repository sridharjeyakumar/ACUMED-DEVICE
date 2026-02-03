import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import RoleMaster from '@/server/models/RoleMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/roles - Get all roles
export async function GET() {
  try {
    await ensureConnection();
    // Use lean() for faster queries
    const roles = await RoleMaster.find().lean().sort({ roll_id: 1 });
    return NextResponse.json(roles, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// POST /api/roles - Create new role
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    const { roll_id, roll_description, remarks, active } = body;
    const role = new RoleMaster({ 
      roll_id, 
      roll_description, 
      remarks, 
      active: active !== false,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await role.save();
    return NextResponse.json(role, { status: 201 });
  } catch (error: any) {
    console.error('Error creating role:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Role ID already exists' },
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
      { error: error.message || 'Failed to create role' },
      { status: 500 }
    );
  }
}

