// app/api/production-plan-details/[batchNo]/[sno]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import ProductionPlanDetail from '@/server/models/ProductionPlanDetails';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/production-plan-details/[batchNo]/[sno] - Get specific production plan detail
export async function GET(
  request: NextRequest,
  { params }: { params: { batchNo: string; sno: string } }
) {
  try {
    await ensureConnection();
    const detail = await ProductionPlanDetail.findOne({ 
      batch_no: params.batchNo.toUpperCase(),
      sno: parseInt(params.sno)
    }).lean();
    
    if (!detail) {
      return NextResponse.json(
        { error: 'Production plan detail not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(detail);
  } catch (error: any) {
    console.error('Error fetching production plan detail:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch production plan detail' },
      { status: 500 }
    );
  }
}

// PUT /api/production-plan-details/[batchNo]/[sno] - Update production plan detail
export async function PUT(
  request: NextRequest,
  { params }: { params: { batchNo: string; sno: string } }
) {
  try {
    await ensureConnection();
    const body = await request.json();
    
    const detail = await ProductionPlanDetail.findOneAndUpdate(
      { 
        batch_no: params.batchNo.toUpperCase(),
        sno: parseInt(params.sno)
      },
      { 
        ...body,
        last_modified_date_time: new Date() 
      },
      { new: true, runValidators: true }
    );
    
    if (!detail) {
      return NextResponse.json(
        { error: 'Production plan detail not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(detail);
  } catch (error: any) {
    console.error('Error updating production plan detail:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update production plan detail' },
      { status: 500 }
    );
  }
}

// DELETE /api/production-plan-details/[batchNo]/[sno] - Delete production plan detail
export async function DELETE(
  request: NextRequest,
  { params }: { params: { batchNo: string; sno: string } }
) {
  try {
    await ensureConnection();
    const detail = await ProductionPlanDetail.findOneAndDelete({ 
      batch_no: params.batchNo.toUpperCase(),
      sno: parseInt(params.sno)
    });
    
    if (!detail) {
      return NextResponse.json(
        { error: 'Production plan detail not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Production plan detail deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting production plan detail:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete production plan detail' },
      { status: 500 }
    );
  }
}