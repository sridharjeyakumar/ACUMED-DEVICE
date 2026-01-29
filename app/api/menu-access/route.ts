import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import MenuAccessMaster from '@/server/models/MenuAccessMaster';

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

// GET /api/menu-access - Get all menu accesses
export async function GET() {
  try {
    await ensureDbConnection();
    const accesses = await MenuAccessMaster.find().sort({ rold_id: 1, menu_id: 1 });
    return NextResponse.json(accesses);
  } catch (error: any) {
    console.error('Error fetching menu accesses:', error);
    const errorMessage = error.message || 'Failed to fetch menu accesses';
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

// POST /api/menu-access - Create new menu access
export async function POST(request: NextRequest) {
  try {
    await ensureDbConnection();
    const body = await request.json();
    const { rold_id, menu_id, access, can_add, can_edit, can_view, can_cancel } = body;
    const menuAccess = new MenuAccessMaster({
      rold_id,
      menu_id,
      access: access !== false,
      can_add: can_add !== false,
      can_edit: can_edit !== false,
      can_view: can_view !== false,
      can_cancel: can_cancel !== false,
    });
    await menuAccess.save();
    return NextResponse.json(menuAccess, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Menu access already exists for this role and menu' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create menu access' },
      { status: 500 }
    );
  }
}

