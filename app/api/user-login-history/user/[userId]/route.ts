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
  { params }: { params: { userId: string } }
) {
  try {
    await ensureDbConnection();
    const histories = await UserLoginHistory.find({ user_id: params.userId })
      .sort({ Date_login_Date: -1, Time_login_Time: -1 });
    return NextResponse.json(histories);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch login histories' },
      { status: 500 }
    );
  }
}


