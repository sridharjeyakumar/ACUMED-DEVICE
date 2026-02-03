import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import CompanyMaster from '@/server/models/CompanyMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/companies - Get all companies
export async function GET() {
  try {
    await ensureConnection();
    // Use lean() for faster queries
    const companies = await CompanyMaster.find().lean().sort({ comp_id: 1 });
    return NextResponse.json(companies, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

// POST /api/companies - Create new company
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    const company = new CompanyMaster({ 
      ...body,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await company.save();
    return NextResponse.json(company, { status: 201 });
  } catch (error: any) {
    console.error('Error creating company:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Company ID already exists' },
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
      { error: error.message || 'Failed to create company' },
      { status: 500 }
    );
  }
}
