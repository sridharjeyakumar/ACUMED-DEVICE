import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import MaterialCategoryMaster from '@/server/models/MaterialCategoryMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/material-categories - Get all material categories
export async function GET() {
  try {
    await ensureConnection();
    // Use lean() for faster queries
    const categories = await MaterialCategoryMaster.find().lean().sort({ material_category_id: 1 });
    return NextResponse.json(categories, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching material categories:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch material categories' },
      { status: 500 }
    );
  }
}

// POST /api/material-categories - Create new material category
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    const category = new MaterialCategoryMaster({ 
      material_category_id: body.material_category_id,
      material_category_name: body.material_category_name,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await category.save();
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error('Error creating material category:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Material Category ID already exists' },
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
      { error: error.message || 'Failed to create material category' },
      { status: 500 }
    );
  }
}
