import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import CartonCapacityMaster from '@/server/models/CartonCapacityMaster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/carton-capacities/seed - Seed carton capacity data
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();

    // Carton capacity data from the image
    const cartonCapacityData = [
      {
        carton_capacity_id: 'SDU24',
        carton_capacity_name: 'DUVET Sterilization Carton - 24s',
        carton_capacity_shortname: 'Sterilization Carton',
        product_id: 'P0001',
        pack_size_id: 'PK24',
        pack_matl_id: 'PM001',
        carton_type_id: 'ST',
        carton_material_id: 'PM004',
        packs_per_carton: 206,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: new Date(),
      },
      {
        carton_capacity_id: 'DDU12',
        carton_capacity_name: 'DUVET Shipper Carton - 12s',
        carton_capacity_shortname: 'Shipper Carton',
        product_id: 'P0001',
        pack_size_id: 'PK12',
        pack_matl_id: 'PM001',
        carton_type_id: 'SH',
        carton_material_id: 'PM005',
        packs_per_carton: 120,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: new Date(),
      },
      {
        carton_capacity_id: 'SXL24',
        carton_capacity_name: 'DUVET XL Sterilization Carton - 24s',
        carton_capacity_shortname: 'Sterilization Carton',
        product_id: 'P0002',
        pack_size_id: 'PK24',
        pack_matl_id: 'PM002',
        carton_type_id: 'ST',
        carton_material_id: 'PM006',
        packs_per_carton: 412,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: new Date(),
      },
      {
        carton_capacity_id: 'DDU24',
        carton_capacity_name: 'DUVET Shipper Carton - 24s',
        carton_capacity_shortname: 'Shipper Carton',
        product_id: 'P0001',
        pack_size_id: 'PK24',
        pack_matl_id: 'PM001',
        carton_type_id: 'SH',
        carton_material_id: 'PM005',
        packs_per_carton: 60,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: new Date(),
      },
      {
        carton_capacity_id: 'SDU12',
        carton_capacity_name: 'DUVET Sterilization Carton - 12s',
        carton_capacity_shortname: 'Sterilization Carton',
        product_id: 'P0001',
        pack_size_id: 'PK12',
        pack_matl_id: 'PM001',
        carton_type_id: 'ST',
        carton_material_id: 'PM004',
        packs_per_carton: 412,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: new Date(),
      },
      {
        carton_capacity_id: 'DXL24',
        carton_capacity_name: 'DUVET XL Shipper Carton - 24s',
        carton_capacity_shortname: 'Shipper Carton',
        product_id: 'P0002',
        pack_size_id: 'PK24',
        pack_matl_id: 'PM002',
        carton_type_id: 'SH',
        carton_material_id: 'PM007',
        packs_per_carton: 240,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: new Date(),
      },
      {
        carton_capacity_id: 'SDU06',
        carton_capacity_name: 'DUVET Sterilization Carton - 6s',
        carton_capacity_shortname: 'Sterilization Carton',
        product_id: 'P0001',
        pack_size_id: 'PK06',
        pack_matl_id: 'PM001',
        carton_type_id: 'ST',
        carton_material_id: 'PM004',
        packs_per_carton: 824,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: new Date(),
      },
      {
        carton_capacity_id: 'DDU06',
        carton_capacity_name: 'DUVET Shipper Carton - 6s',
        carton_capacity_shortname: 'Shipper Carton',
        product_id: 'P0001',
        pack_size_id: 'PK06',
        pack_matl_id: 'PM001',
        carton_type_id: 'SH',
        carton_material_id: 'PM005',
        packs_per_carton: 250,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: new Date(),
      },
      {
        carton_capacity_id: 'SNA24',
        carton_capacity_name: 'Nanai Sterilization Carton - 24s',
        carton_capacity_shortname: 'Sterilization Carton',
        product_id: 'P0004',
        pack_size_id: 'PK24',
        pack_matl_id: 'PM012',
        carton_type_id: 'ST',
        carton_material_id: 'PM012',
        packs_per_carton: 412,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: new Date(),
      },
      {
        carton_capacity_id: 'DNA12',
        carton_capacity_name: 'Nanai Shipper Carton - 12s',
        carton_capacity_shortname: 'Shipper Carton',
        product_id: 'P0004',
        pack_size_id: 'PK12',
        pack_matl_id: 'PM012',
        carton_type_id: 'SH',
        carton_material_id: 'PM013',
        packs_per_carton: 240,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: new Date(),
      },
      {
        carton_capacity_id: 'DNA24',
        carton_capacity_name: 'Nanai Shipper Carton - 24s',
        carton_capacity_shortname: 'Shipper Carton',
        product_id: 'P0004',
        pack_size_id: 'PK24',
        pack_matl_id: 'PM012',
        carton_type_id: 'SH',
        carton_material_id: 'PM013',
        packs_per_carton: 412,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: new Date(),
      },
    ];

    // Use bulkWrite with upsert to insert or update records
    const operations = cartonCapacityData.map((data) => ({
      updateOne: {
        filter: { carton_capacity_id: data.carton_capacity_id },
        update: { $set: data },
        upsert: true,
      },
    }));

    const result = await CartonCapacityMaster.bulkWrite(operations);

    return NextResponse.json({
      message: 'Carton capacity data seeded successfully',
      inserted: result.upsertedCount,
      modified: result.modifiedCount,
      matched: result.matchedCount,
    });
  } catch (error: any) {
    console.error('Error seeding carton capacity data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed carton capacity data' },
      { status: 500 }
    );
  }
}

