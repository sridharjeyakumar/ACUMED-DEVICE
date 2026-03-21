import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { ensureConnection } from '@/server/db/connection';
import UserMaster from '@/server/models/UserMaster';

export async function POST(request: NextRequest) {
  try {
    await ensureConnection();

    const { user_id, employee_id, password, super_admin } = await request.json();

    if (!user_id || !employee_id || !password) {
      return NextResponse.json(
        { error: 'User ID, Employee ID, and password are required' },
        { status: 400 }
      );
    }

    if (user_id.length > 10) {
      return NextResponse.json({ error: 'User ID must be 10 characters or less' }, { status: 400 });
    }

    if (employee_id.length > 5) {
      return NextResponse.json(
        { error: 'Employee ID must be 5 characters or less' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const existing = await UserMaster.findOne({ user_id: user_id.trim() });
    if (existing) {
      return NextResponse.json({ error: 'User ID already exists' }, { status: 409 });
    }

    const hash_password = await bcrypt.hash(password, 10);

    const passwordExpiryDate = new Date();
    passwordExpiryDate.setDate(passwordExpiryDate.getDate() + 90);

    const user = new UserMaster({
      user_id: user_id.trim(),
      employee_id: employee_id.trim(),
      hash_password,
      Date_password_changed_date: new Date(),
      Date_password_expiry_date: passwordExpiryDate,
      N_password_expiry_days: 90,
      active: true,
      super_admin: super_admin === true,
    });

    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. You can now log in.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'User ID already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Signup failed. Please try again.' }, { status: 500 });
  }
}
