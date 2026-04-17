import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import VendorMaster from '@/server/models/VendorMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function ensureDbConnection() {
  try {
    await ensureConnection();
  } catch (error: any) {
    console.error('Database connection error:', error);
    throw new Error('Database connection failed');
  }
}

// GET /api/vendors/[id] - Get vendor by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    await ensureDbConnection();
    const vendor = await VendorMaster.findOne({ vendor_id: id }).lean();
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }
    return NextResponse.json(vendor);
  } catch (error: any) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch vendor',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// PUT /api/vendors/[id] - Update vendor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    await ensureDbConnection();
    const body = await request.json();

    const cleanValue = (value: any) => (value === '' || value === null) ? undefined : value;

    const updateData: any = {};

    if (body.vendor_name !== undefined) updateData.vendor_name = body.vendor_name;
    if (body.vendor_short_name !== undefined) updateData.vendor_short_name = body.vendor_short_name;
    if (body.vendor_type !== undefined) updateData.vendor_type = body.vendor_type;
    if (body.address1 !== undefined) updateData.address1 = body.address1;
    if (body.address2 !== undefined) updateData.address2 = cleanValue(body.address2);
    if (body.city !== undefined) updateData.city = body.city;
    if (body.district !== undefined) updateData.district = body.district;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.pincode !== undefined) updateData.pincode = Number(body.pincode);
    if (body.gst_no !== undefined) updateData.gst_no = cleanValue(body.gst_no);
    if (body.cin_no !== undefined) updateData.cin_no = cleanValue(body.cin_no);
    if (body.pan_no !== undefined) updateData.pan_no = cleanValue(body.pan_no);
    if (body.tan_no !== undefined) updateData.tan_no = cleanValue(body.tan_no);
    if (body.contact_person !== undefined) updateData.contact_person = cleanValue(body.contact_person);
    if (body.contact_no !== undefined) updateData.contact_no = body.contact_no ? Number(body.contact_no) : undefined;
    if (body.contact_email_id !== undefined) updateData.contact_email_id = cleanValue(body.contact_email_id);
    if (body.website !== undefined) updateData.website = cleanValue(body.website);
    if (body.active !== undefined) updateData.active = body.active !== false;
    if (body.default_shipping_instruction !== undefined) updateData.default_shipping_instruction = cleanValue(body.default_shipping_instruction);
    if (body.default_terms_of_payment !== undefined) updateData.default_terms_of_payment = cleanValue(body.default_terms_of_payment);

    updateData.last_modified_user_id = body.last_modified_user_id || 'ADMIN';
    updateData.last_modified_date_time = new Date();

    const vendor = await VendorMaster.findOneAndUpdate(
      { vendor_id: id },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json(vendor);
  } catch (error: any) {
    console.error('Error updating vendor:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: error.message || 'Failed to update vendor',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/vendors/[id] - Delete vendor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    await ensureDbConnection();
    const vendor = await VendorMaster.findOneAndDelete({ vendor_id: id });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Vendor deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to delete vendor',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
