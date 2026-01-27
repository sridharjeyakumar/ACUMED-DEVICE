import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import UserLoginHistory from '@/server/models/UserLoginHistory';

// Ensure DB connection
let dbConnected = false;
async function ensureDbConnection() {
  const mongoose = await import('mongoose');
  if (mongoose.default.connection.readyState === 1) {
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

// GET /api/user-login-history - Get all login histories
export async function GET() {
  try {
    await ensureDbConnection();
    const histories = await UserLoginHistory.find().sort({ Date_login_Date: -1, Time_login_Time: -1 });
    return NextResponse.json(histories);
  } catch (error: any) {
    console.error('Error fetching login histories:', error);
    const errorMessage = error.message || 'Failed to fetch login histories';
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

// POST /api/user-login-history - Create new login history
export async function POST(request: NextRequest) {
  try {
    await ensureDbConnection();
    const body = await request.json();
    const { user_id, Date_login_Date, Time_login_Time, Date_Logout_Date, Time_Logout_Time } = body;
    
    const loginHistory = new UserLoginHistory({
      user_id,
      Date_login_Date: Date_login_Date ? new Date(Date_login_Date) : new Date(),
      Time_login_Time: Time_login_Time || new Date().toTimeString().slice(0, 8),
      Date_Logout_Date: Date_Logout_Date ? new Date(Date_Logout_Date) : undefined,
      Time_Logout_Time: Time_Logout_Time || undefined,
    });
    
    await loginHistory.save();
    return NextResponse.json(loginHistory, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create login history' },
      { status: 500 }
    );
  }
}

