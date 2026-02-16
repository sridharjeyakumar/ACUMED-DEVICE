import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import MenuAccessMaster from '@/server/models/MenuAccessMaster';

// Force Node.js runtime (required for Mongoose)
export const runtime = 'nodejs';

// Route segment config
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Ensure DB connection
let dbConnected = false;
async function ensureDbConnection() {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
}

// GET /api/menu-access/[roldId]/[menuId] - Get menu access by role and menu
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roldId: string; menuId: string }> }
) {
  try {
    const { roldId, menuId } = await params;
    await ensureDbConnection();
    const access = await MenuAccessMaster.findOne({
      rold_id: roldId,
      menu_id: menuId,
    });
    if (!access) {
      return NextResponse.json({ error: 'Menu access not found' }, { status: 404 });
    }
    return NextResponse.json(access);
  } catch (error: any) {
    console.error('Error fetching menu access:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch menu access' },
      { status: 500 }
    );
  }
}

// PUT /api/menu-access/[roldId]/[menuId] - Update menu access
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roldId: string; menuId: string }> }
) {
  try {
    const { roldId, menuId } = await params;
    await ensureDbConnection();
    const body = await request.json();
    const { access, can_add, can_edit, can_view, can_cancel } = body;
    const updateData: any = {
      access: access !== false,
      can_add: can_add !== false,
      can_edit: can_edit !== false,
      can_view: can_view !== false,
      can_cancel: can_cancel !== false,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    };
    const menuAccess = await MenuAccessMaster.findOneAndUpdate(
      { rold_id: roldId, menu_id: menuId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!menuAccess) {
      return NextResponse.json({ error: 'Menu access not found' }, { status: 404 });
    }
    return NextResponse.json(menuAccess);
  } catch (error: any) {
    console.error('Error updating menu access:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update menu access' },
      { status: 500 }
    );
  }
}

// DELETE /api/menu-access/[roldId]/[menuId] - Delete menu access
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roldId: string; menuId: string }> }
) {
  try {
    const { roldId, menuId } = await params;
    await ensureDbConnection();
    const menuAccess = await MenuAccessMaster.findOneAndDelete({
      rold_id: roldId,
      menu_id: menuId,
    });
    if (!menuAccess) {
      return NextResponse.json({ error: 'Menu access not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Menu access deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting menu access:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete menu access' },
      { status: 500 }
    );
  }
}



