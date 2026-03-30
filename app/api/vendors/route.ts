import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import VendorMaster from '@/server/models/VendorMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/vendors - Get all vendors
export async function GET() {
  try {
    await ensureConnection();
    const vendors = await VendorMaster.find().lean().sort({ vendor_id: 1 });
    return NextResponse.json(vendors, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

// POST /api/vendors - Create new vendor
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();

    const vendor = new VendorMaster({
      ...body,
      pincode: body.pincode ? Number(body.pincode) : undefined,
      contact_no: body.contact_no ? Number(body.contact_no) : undefined,
      active: body.active !== undefined ? body.active : true,
      last_modified_user_id: body.last_modified_user_id || 'ADMIN',
      last_modified_date_time: new Date(),
    });
    await vendor.save();
    return NextResponse.json(vendor, { status: 201 });
  } catch (error: any) {
    console.error('Error creating vendor:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Vendor ID already exists' },
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
      { error: error.message || 'Failed to create vendor' },
      { status: 500 }
    );
  }
}
