import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    const citizens = await prisma.citizen.findMany({
      where: query
        ? {
            OR: [
              { firstName: { contains: query } },
              { lastName: { contains: query } },
              { phone: { contains: query } },
              { job: { contains: query } },
            ],
          }
        : undefined,
      include: {
        warrants: {
          where: { status: "Actif" },
        },
        _count: {
          select: {
            citations: true,
            arrestReports: true,
            vehicles: true,
            weapons: true,
          },
        },
      },
      orderBy: { lastName: "asc" },
    });

    return NextResponse.json(citizens);
  } catch (error) {
    console.error("GET citizens error:", error);
    return NextResponse.json({ error: "Failed to fetch citizens" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const citizen = await prisma.citizen.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        birthDate: body.birthDate || "1990-01-01",
        gender: body.gender || "M",
        phone: body.phone || null,
        address: body.address || null,
        job: body.job || "Sans emploi",
        photoUrl: body.photoUrl || null,
        driverLicense: body.driverLicense || "Valide",
        weaponLicense: body.weaponLicense || "Non titulaire",
        notes: body.notes || null,
        dangerLevel: body.dangerLevel || "Faible",
      },
    });
    return NextResponse.json(citizen, { status: 201 });
  } catch (error) {
    console.error("POST citizen error:", error);
    return NextResponse.json({ error: "Failed to create citizen" }, { status: 500 });
  }
}
