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

    const updated = await ProductMachineMaster.findByIdAndUpdate(
      id,
      { active: body.active },
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
