import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/server/db/connection';
import MenuAccessMaster from '@/server/models/MenuAccessMaster';

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
  { params }: { params: { roldId: string; menuId: string } }
) {
  try {
    await ensureDbConnection();
    const access = await MenuAccessMaster.findOne({
      rold_id: params.roldId,
      menu_id: params.menuId,
    });
    if (!access) {
      return NextResponse.json({ error: 'Menu access not found' }, { status: 404 });
    }
    return NextResponse.json(access);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch menu access' },
      { status: 500 }
    );
  }
}

// PUT /api/menu-access/[roldId]/[menuId] - Update menu access
export async function PUT(
  request: NextRequest,
  { params }: { params: { roldId: string; menuId: string } }
) {
  try {
    await ensureDbConnection();
    const body = await request.json();
    const { access, can_add, can_edit, can_view, can_cancel } = body;
    const menuAccess = await MenuAccessMaster.findOneAndUpdate(
      { rold_id: params.roldId, menu_id: params.menuId },
      {
        access: access !== false,
        can_add: can_add !== false,
        can_edit: can_edit !== false,
        can_view: can_view !== false,
        can_cancel: can_cancel !== false,
      },
      { new: true, runValidators: true }
    );
    if (!menuAccess) {
      return NextResponse.json({ error: 'Menu access not found' }, { status: 404 });
    }
    return NextResponse.json(menuAccess);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update menu access' },
      { status: 500 }
    );
  }
}

// DELETE /api/menu-access/[roldId]/[menuId] - Delete menu access
export async function DELETE(
  request: NextRequest,
  { params }: { params: { roldId: string; menuId: string } }
) {
  try {
    await ensureDbConnection();
    const menuAccess = await MenuAccessMaster.findOneAndDelete({
      rold_id: params.roldId,
      menu_id: params.menuId,
    });
    if (!menuAccess) {
      return NextResponse.json({ error: 'Menu access not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Menu access deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete menu access' },
      { status: 500 }
    );
  }
}


