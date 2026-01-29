import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import UserLoginHistory from '@/server/models/UserLoginHistory';

// Ensure DB connection
let dbConnected = false;
async function ensureDbConnection() {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
}

// GET /api/user-login-history/user/[userId] - Get login history by user ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    await ensureDbConnection();
    const histories = await UserLoginHistory.find({ user_id: userId })
      .sort({ Date_login_Date: -1, Time_login_Time: -1 });
    return NextResponse.json(histories);
  } catch (error: any) {
    console.error('Error fetching login histories:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch login histories' },
      { status: 500 }
    );
  }
}



