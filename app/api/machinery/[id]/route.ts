import { NextRequest, NextResponse } from "next/server";
import { ensureConnection } from "@/server/db/connection";
import ProductMachineMaster from "@/server/models/ProductMachinerMaster";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureConnection();

    const { id } = params;
    const body = await request.json();

    const updateData: any = {
      last_modified_user_id: body.lastModifiedUserId ?? "ADMIN",
      last_modified_date_time: new Date(),
    };

    if (body.active !== undefined) updateData.active = body.active;
    if (body.machineName !== undefined) updateData.machine_name = body.machineName;
    if (body.shortName !== undefined) updateData.machine_short_name = body.shortName;
    if (body.qtyPerMin !== undefined) updateData.prod_qty_per_minute = Number(body.qtyPerMin);
    if (body.uom !== undefined) updateData.uom = body.uom;
    if (body.avgHrsPerDay !== undefined) updateData.avg_prod_hrs_per_day = Number(body.avgHrsPerDay);
    if (body.remarks !== undefined) updateData.remarks = body.remarks;

    const updated = await ProductMachineMaster.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Update failed" },
      { status: 500 }
    );
  }
}
