import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import UserMaster from '@/server/models/UserMaster';
import bcrypt from 'bcryptjs';

// Ensure DB connection
let dbConnected = false;
async function ensureDbConnection() {
  const mongoose = await import('mongoose');
  const readyState = mongoose.default.connection.readyState as number;
  if (readyState === 1) {
    return;
  }
  
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (error: any) {
      dbConnected = false;
      throw error;
    }
  }
}

// GET /api/users - Get all users
export async function GET() {
  try {
    await ensureDbConnection();
    const users = await UserMaster.find().select('-hash_password').sort({ user_id: 1 });
    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    const errorMessage = error.message || 'Failed to fetch users';
    const isDbError = error.message?.includes('Database') || error.message?.includes('MongoDB') || error.message?.includes('connection');
    return NextResponse.json(
      { 
        error: errorMessage,
        details: isDbError ? 'Database connection issue. Please check your Database environment variable.' : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    await ensureDbConnection();
    const body = await request.json();
    const { user_id, employee_id, password, N_password_expiry_days, active } = body;
    
    // Hash password
    const hash_password = await bcrypt.hash(password || 'defaultPassword123', 10);
    
    const passwordExpiryDate = new Date();
    passwordExpiryDate.setDate(passwordExpiryDate.getDate() + (N_password_expiry_days || 90));

    const user = new UserMaster({
      user_id,
      employee_id,
      hash_password,
      Date_password_changed_date: new Date(),
      Date_password_expiry_date: passwordExpiryDate,
      N_password_expiry_days: N_password_expiry_days || 90,
      active: active !== false,
    });
    
    const savedUser = await user.save();
    const userResponse = savedUser.toObject();
    delete userResponse.hash_password;
    return NextResponse.json(userResponse, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User ID already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

