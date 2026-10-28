import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    const vehicles = await prisma.registeredVehicle.findMany({
      where: query
        ? {
            OR: [
              { plate: { contains: query } },
              { model: { contains: query } },
              { color: { contains: query } },
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
    return NextResponse.json(vehicles);
  } catch (error) {
    console.error("GET vehicles error:", error);
    return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const vehicle = await prisma.registeredVehicle.create({
      data: {
        plate: body.plate.toUpperCase().trim(),
        model: body.model,
        color: body.color,
        status: body.status || "En règle",
        notes: body.notes || null,
        ownerId: body.ownerId || null,
      },
      include: {
        owner: true,
      },
    });
    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error("POST vehicle error:", error);
    return NextResponse.json({ error: "Failed to create vehicle" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const vehicle = await prisma.registeredVehicle.update({
      where: { id: body.id },
      data: {
        status: body.status,
        notes: body.notes !== undefined ? body.notes : undefined,
      },
      include: {
        owner: true,
      },
    });
    return NextResponse.json(vehicle);
  } catch (error) {
    console.error("PATCH vehicle error:", error);
    return NextResponse.json({ error: "Failed to update vehicle" }, { status: 500 });
  }
}
