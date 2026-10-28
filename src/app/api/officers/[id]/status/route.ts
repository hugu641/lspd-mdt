import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updateData: Record<string, any> = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.unitType !== undefined) updateData.unitType = body.unitType;
    if (body.rank !== undefined) updateData.rank = body.rank;
    if (body.callsign !== undefined) updateData.callsign = body.callsign;
    if (body.isInstructor !== undefined) updateData.isInstructor = body.isInstructor;

    const officer = await prisma.officer.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(officer);
  } catch (error) {
    console.error("PATCH officer error:", error);
    return NextResponse.json({ error: "Failed to update officer status" }, { status: 500 });
  }
}
