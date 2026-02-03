import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import MenuAccessMaster from '@/server/models/MenuAccessMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/menu-access - Get all menu accesses
export async function GET() {
  try {
    await ensureConnection();
    // Use lean() for faster queries
    const accesses = await MenuAccessMaster.find().lean().sort({ rold_id: 1, menu_id: 1 });
    return NextResponse.json(accesses, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
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
    await ensureConnection();
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

