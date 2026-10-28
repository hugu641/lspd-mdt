import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const warrants = await prisma.warrant.findMany({
      where: status ? { status } : undefined,
      include: {
        officer: true,
        citizen: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(warrants);
  } catch (error) {
    console.error("GET warrants error:", error);
    return NextResponse.json({ error: "Failed to fetch warrants" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const count = await prisma.warrant.count();
    const prefix = body.type === "BOLO_VEHICLE" ? "BOLO-V" : body.type === "BOLO_PERSON" ? "BOLO-P" : "WRT";
    const warrantNumber = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

    const warrant = await prisma.warrant.create({
      data: {
        warrantNumber,
        type: body.type || "WARRANT",
        title: body.title,
        description: body.description,
        dangerLevel: body.dangerLevel || "Modéré",
        status: "Actif",
        officerId: body.officerId,
        citizenId: body.citizenId || null,
        vehiclePlate: body.vehiclePlate || null,
      },
      include: {
        officer: true,
        citizen: true,
      },
    });

    return NextResponse.json(warrant, { status: 201 });
  } catch (error) {
    console.error("POST warrant error:", error);
    return NextResponse.json({ error: "Failed to create warrant" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const warrant = await prisma.warrant.update({
      where: { id: body.id },
      data: {
        status: body.status, // "Actif", "Exécuté", "Annulé"
      },
    });
    return NextResponse.json(warrant);
  } catch (error) {
    console.error("PATCH warrant error:", error);
    return NextResponse.json({ error: "Failed to update warrant" }, { status: 500 });
  }
}
