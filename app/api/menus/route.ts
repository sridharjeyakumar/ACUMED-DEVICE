import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import MenuMaster from '@/server/models/MenuMaster';

// Ensure DB connection
let dbConnected = false;
let connectionAttempted = false;

async function ensureDbConnection() {
  // Check if already connected
  const mongoose = await import('mongoose');
  if (mongoose.default.connection.readyState === 1) {
    return; // Already connected
  }
  
  if (!dbConnected && !connectionAttempted) {
    connectionAttempted = true;
    try {
      await connectDB();
      dbConnected = true;
    } catch (error: any) {
      dbConnected = false;
      connectionAttempted = false; // Allow retry
      throw error;
    }
  } else if (!dbConnected) {
    // Connection was attempted but failed
    throw new Error('Database connection failed. Please check your Database environment variable.');
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
    const menu = new MenuMaster({ menu_id, menu_desc, active: active !== false });
    await menu.save();
    return NextResponse.json(menu, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Menu ID already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create menu' },
      { status: 500 }
    );
  }
}

