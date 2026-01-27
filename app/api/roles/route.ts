import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import RoleMaster from '@/server/models/RoleMaster';

// Ensure DB connection
let dbConnected = false;
async function ensureDbConnection() {
  // Check if already connected
  const mongoose = await import('mongoose');
  if (mongoose.default.connection.readyState === 1) {
    return; // Already connected
  }
  
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (error: any) {
      dbConnected = false; // Reset on error
      throw error;
    }
  }
}

// GET /api/roles - Get all roles
export async function GET() {
  try {
    await ensureDbConnection();
    const roles = await RoleMaster.find().sort({ roll_id: 1 });
    return NextResponse.json(roles);
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
    await ensureDbConnection();
    const body = await request.json();
    const { roll_id, roll_description, remarks, active } = body;
    const role = new RoleMaster({ roll_id, roll_description, remarks, active: active !== false });
    await role.save();
    return NextResponse.json(role, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Role ID already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}

