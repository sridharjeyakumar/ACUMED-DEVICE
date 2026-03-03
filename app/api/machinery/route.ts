import { NextRequest, NextResponse } from "next/server";
import { ensureConnection } from "@/server/db/connection";
import ProductMachineMaster from "@/server/models/ProductMachinerMaster";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ✅ GET ALL MACHINES
export async function GET() {
  try {
    await ensureConnection();

    const machines = await ProductMachineMaster.find()
      .sort({ machine_id: 1 })
      .lean();

    return NextResponse.json(machines);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch machines" },
      { status: 500 }
    );
  }
}

// ✅ CREATE MACHINE
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();

    const body = await request.json();

    const machine = await ProductMachineMaster.create({
      machine_id: body.machineId,
      machine_name: body.machineName,
      machine_short_name: body.shortName,
      prod_qty_per_minute: Number(body.qtyPerMin),
      uom: body.uom,
      avg_prod_hrs_per_day: Number(body.avgHrsPerDay),
      active: body.active ?? true,
      remarks: body.remarks ?? "",
    });

    return NextResponse.json(machine, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create machine" },
      { status: 500 }
    );
  }
}
