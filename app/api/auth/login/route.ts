import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { ensureConnection } from '@/server/db/connection';
import UserMaster from '@/server/models/UserMaster';

export async function POST(request: NextRequest) {
  try {
    await ensureConnection();

    const { user_id, password } = await request.json();

    if (!user_id || !password) {
      return NextResponse.json({ error: 'User ID and password are required' }, { status: 400 });
    }

    const user = await UserMaster.findOne({ user_id: user_id.trim() });

    if (!user) {
      return NextResponse.json({ error: 'Invalid user ID or password' }, { status: 401 });
    }

    if (!user.active) {
      return NextResponse.json({ error: 'Account is inactive. Contact administrator.' }, { status: 403 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.hash_password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid user ID or password' }, { status: 401 });
    }

    // Update last login date and time
    const now = new Date();
    await UserMaster.updateOne(
      { user_id: user.user_id },
      {
        Date_last_login_date: now,
        Time_last_login_time: now.toTimeString().slice(0, 8),
      }
    );

    // Return user data (no password)
    const userData = {
      user_id: user.user_id,
      employee_id: user.employee_id,
      role_id: user.role_id,
      active: user.active,
      super_admin: user.super_admin ?? false,
      Date_last_login_date: now,
    };

    return NextResponse.json({ success: true, user: userData }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
