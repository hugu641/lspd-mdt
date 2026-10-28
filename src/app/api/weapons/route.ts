import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    const weapons = await prisma.registeredWeapon.findMany({
      where: query
        ? {
            OR: [
              { serialNumber: { contains: query } },
              { modelName: { contains: query } },
              { weaponType: { contains: query } },
              { owner: { firstName: { contains: query } } },
              { owner: { lastName: { contains: query } } },
            ],
          }
        : undefined,
      include: {
        owner: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(weapons);
  } catch (error) {
    console.error("GET weapons error:", error);
    return NextResponse.json({ error: "Failed to fetch weapons" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const weapon = await prisma.registeredWeapon.create({
      data: {
        serialNumber: body.serialNumber.toUpperCase().trim(),
        weaponType: body.weaponType,
        modelName: body.modelName,
        status: body.status || "En règle",
        notes: body.notes || null,
        ownerId: body.ownerId || null,
      },
      include: {
        owner: true,
      },
    });
    return NextResponse.json(weapon, { status: 201 });
  } catch (error) {
    console.error("POST weapon error:", error);
    return NextResponse.json({ error: "Failed to create weapon" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const weapon = await prisma.registeredWeapon.update({
      where: { id: body.id },
      data: {
        status: body.status,
        notes: body.notes !== undefined ? body.notes : undefined,
      },
      include: {
        owner: true,
      },
    });
    return NextResponse.json(weapon);
  } catch (error) {
    console.error("PATCH weapon error:", error);
    return NextResponse.json({ error: "Failed to update weapon" }, { status: 500 });
  }
}
