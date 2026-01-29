import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import MenuMaster from '@/server/models/MenuMaster';

// Ensure DB connection
let dbConnected = false;

async function ensureDbConnection() {
  const mongoose = await import('mongoose');
  // Check if already connected (1 = connected)
  const readyState = mongoose.default.connection.readyState as number;
  if (readyState === 1) {
    dbConnected = true;
    return; // Already connected
  }
  
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (error: any) {
      dbConnected = false;
      console.error('Database connection error:', error);
      throw error;
    }
  } else {
    // Verify connection is still alive
    if (readyState !== 1) {
      dbConnected = false;
      await ensureDbConnection();
    }
  }
}

// GET /api/menus - Get all menus
export async function GET() {
  try {
    await ensureDbConnection();
    const menus = await MenuMaster.find().sort({ menu_id: 1 });
    return NextResponse.json(menus);
  } catch (error: any) {
    console.error('Error fetching menus:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Provide more detailed error information
    const errorMessage = error.message || 'Failed to fetch menus';
    const isDbError = error.message?.includes('Database') || 
                     error.message?.includes('MongoDB') || 
                     error.message?.includes('connection') ||
                     error.message?.includes('environment variable');
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: isDbError ? 'Database connection issue. Please check your Database environment variable.' : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/menus - Create new menu
export async function POST(request: NextRequest) {
  try {
    await ensureDbConnection();
    const body = await request.json();
    const { menu_id, menu_desc, active } = body;
    const menu = new MenuMaster({ 
      menu_id, 
      menu_desc, 
      active: active !== false,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await menu.save();
    return NextResponse.json(menu, { status: 201 });
  } catch (error: any) {
    console.error('Error creating menu:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Menu ID already exists' },
        { status: 400 }
      );
    }
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create menu' },
      { status: 500 }
    );
  }
}

