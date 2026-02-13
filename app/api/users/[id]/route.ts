import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import UserMaster from '@/server/models/UserMaster';
import bcrypt from 'bcryptjs';

// Force Node.js runtime (required for Mongoose)
export const runtime = 'nodejs';

// Route segment config
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Ensure DB connection
let dbConnected = false;
async function ensureDbConnection() {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
}

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const user = await UserMaster.findOne({ user_id: id }).select('-hash_password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const body = await request.json();
    const { employee_id, role_id, password, N_password_expiry_days, active } = body;
    const updateData: any = {
      employee_id,
      active: active !== false,
    };
    
    // Update role_id if provided (allow empty string to clear role_id)
    if (role_id !== undefined) {
      updateData.role_id = role_id || undefined;
    }

    // Update password if provided
    if (password) {
      updateData.hash_password = await bcrypt.hash(password, 10);
      updateData.Date_password_changed_date = new Date();
      if (N_password_expiry_days) {
        const passwordExpiryDate = new Date();
        passwordExpiryDate.setDate(passwordExpiryDate.getDate() + N_password_expiry_days);
        updateData.Date_password_expiry_date = passwordExpiryDate;
        updateData.N_password_expiry_days = N_password_expiry_days;
      }
    } else if (N_password_expiry_days) {
      const passwordExpiryDate = new Date();
      passwordExpiryDate.setDate(passwordExpiryDate.getDate() + N_password_expiry_days);
      updateData.Date_password_expiry_date = passwordExpiryDate;
      updateData.N_password_expiry_days = N_password_expiry_days;
    }

    const user = await UserMaster.findOneAndUpdate(
      { user_id: id },
      updateData,
      { new: true, runValidators: true }
    ).select('-hash_password');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbConnection();
    const user = await UserMaster.findOneAndDelete({ user_id: id });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}



