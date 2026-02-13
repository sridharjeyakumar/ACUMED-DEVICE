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
    // #region agent log
    const fs = require('fs');
    const logPath = 'c:\\Users\\ACER\\Downloads\\new update\\ACUMED-DEVICE-super-admin-\\.cursor\\debug.log';
    const logEntry = JSON.stringify({location:'app/api/menu-access/[roldId]/[menuId]/route.ts:56',message:'PUT request received',data:{roldId,menuId,body:{access,can_add,can_edit,can_view,can_cancel}},timestamp:Date.now(),runId:'post-fix',hypothesisId:'H3'})+'\n';
    fs.appendFileSync(logPath, logEntry);
    // #endregion
    const updateData: any = {
      access: access !== false,
      can_add: can_add !== false,
      can_edit: can_edit !== false,
      can_view: can_view !== false,
      can_cancel: can_cancel !== false,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    };
    // #region agent log
    const logEntry2 = JSON.stringify({location:'app/api/menu-access/[roldId]/[menuId]/route.ts:66',message:'Before findOneAndUpdate',data:{query:{rold_id:roldId,menu_id:menuId},updateData},timestamp:Date.now(),runId:'post-fix',hypothesisId:'H3'})+'\n';
    fs.appendFileSync(logPath, logEntry2);
    // #endregion
    const menuAccess = await MenuAccessMaster.findOneAndUpdate(
      { rold_id: roldId, menu_id: menuId },
      updateData,
      { new: true, runValidators: true }
    );
    // #region agent log
    const logEntry3 = JSON.stringify({location:'app/api/menu-access/[roldId]/[menuId]/route.ts:72',message:'After findOneAndUpdate',data:{menuAccess:menuAccess?{rold_id:menuAccess.rold_id,menu_id:menuAccess.menu_id,access:menuAccess.access,can_add:menuAccess.can_add,can_edit:menuAccess.can_edit,can_view:menuAccess.can_view,can_cancel:menuAccess.can_cancel}:null},timestamp:Date.now(),runId:'post-fix',hypothesisId:'H3'})+'\n';
    fs.appendFileSync(logPath, logEntry3);
    // #endregion
    if (!menuAccess) {
      // #region agent log
      const logEntry4 = JSON.stringify({location:'app/api/menu-access/[roldId]/[menuId]/route.ts:75',message:'Menu access not found',data:{roldId,menuId},timestamp:Date.now(),runId:'post-fix',hypothesisId:'H3'})+'\n';
      fs.appendFileSync(logPath, logEntry4);
      // #endregion
      return NextResponse.json({ error: 'Menu access not found' }, { status: 404 });
    }
    return NextResponse.json(menuAccess);
  } catch (error: any) {
    // #region agent log
    const fs = require('fs');
    const logPath = 'c:\\Users\\ACER\\Downloads\\new update\\ACUMED-DEVICE-super-admin-\\.cursor\\debug.log';
    const logEntry5 = JSON.stringify({location:'app/api/menu-access/[roldId]/[menuId]/route.ts:82',message:'PUT error',data:{error:error.message,errorStack:error.stack},timestamp:Date.now(),runId:'post-fix',hypothesisId:'H3'})+'\n';
    fs.appendFileSync(logPath, logEntry5);
    // #endregion
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



