import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import MenuMaster from '@/server/models/MenuMaster';

// Ensure DB connection
let dbConnected = false;
async function ensureDbConnection() {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
}

// GET /api/menus/[id] - Get menu by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDbConnection();
    const menu = await MenuMaster.findOne({ menu_id: params.id });
    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }
    return NextResponse.json(menu);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch menu' },
      { status: 500 }
    );
  }
}

// PUT /api/menus/[id] - Update menu
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDbConnection();
    const body = await request.json();
    const { menu_desc, active } = body;
    const menu = await MenuMaster.findOneAndUpdate(
      { menu_id: params.id },
      { menu_desc, active: active !== false },
      { new: true, runValidators: true }
    );
    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }
    return NextResponse.json(menu);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update menu' },
      { status: 500 }
    );
  }
}

// DELETE /api/menus/[id] - Delete menu
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDbConnection();
    const menu = await MenuMaster.findOneAndDelete({ menu_id: params.id });
    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Menu deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete menu' },
      { status: 500 }
    );
  }
}


