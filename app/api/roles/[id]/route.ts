import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import RoleMaster from '@/server/models/RoleMaster';

// Ensure DB connection
let dbConnected = false;
async function ensureDbConnection() {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
}

// GET /api/roles/[id] - Get role by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDbConnection();
    const role = await RoleMaster.findOne({ roll_id: params.id });
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    return NextResponse.json(role);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: 500 }
    );
  }
}

// PUT /api/roles/[id] - Update role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDbConnection();
    const body = await request.json();
    const { roll_description, remarks, active } = body;
    const role = await RoleMaster.findOneAndUpdate(
      { roll_id: params.id },
      { roll_description, remarks, active: active !== false },
      { new: true, runValidators: true }
    );
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    return NextResponse.json(role);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

// DELETE /api/roles/[id] - Delete role
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDbConnection();
    const role = await RoleMaster.findOneAndDelete({ roll_id: params.id });
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}


