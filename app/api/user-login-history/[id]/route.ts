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

// GET /api/user-login-history/[id] - Get login history by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDbConnection();
    const history = await UserLoginHistory.findById(params.id);
    if (!history) {
      return NextResponse.json({ error: 'Login history not found' }, { status: 404 });
    }
    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch login history' },
      { status: 500 }
    );
  }
}

// PUT /api/user-login-history/[id] - Update login history
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDbConnection();
    const body = await request.json();
    const { Date_login_Date, Time_login_Time, Date_Logout_Date, Time_Logout_Time } = body;
    
    const updateData: any = {};
    if (Date_login_Date) updateData.Date_login_Date = new Date(Date_login_Date);
    if (Time_login_Time) updateData.Time_login_Time = Time_login_Time;
    if (Date_Logout_Date) updateData.Date_Logout_Date = new Date(Date_Logout_Date);
    if (Time_Logout_Time) updateData.Time_Logout_Time = Time_Logout_Time;

    const history = await UserLoginHistory.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!history) {
      return NextResponse.json({ error: 'Login history not found' }, { status: 404 });
    }
    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update login history' },
      { status: 500 }
    );
  }
}

// DELETE /api/user-login-history/[id] - Delete login history
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDbConnection();
    const history = await UserLoginHistory.findByIdAndDelete(params.id);
    if (!history) {
      return NextResponse.json({ error: 'Login history not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Login history deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete login history' },
      { status: 500 }
    );
  }
}



