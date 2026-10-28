import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const phone = searchParams.get("phone")?.trim() || "";
    const firstName = searchParams.get("firstName")?.trim() || "";
    const lastName = searchParams.get("lastName")?.trim() || "";

    const whereClauses: any[] = [];

    if (phone) {
      whereClauses.push({ phone: { contains: phone, mode: "insensitive" } });
    }

    if (firstName && lastName) {
      whereClauses.push({
        AND: [
          { firstName: { contains: firstName, mode: "insensitive" } },
          { lastName: { contains: lastName, mode: "insensitive" } },
        ],
      });
    } else if (firstName) {
      whereClauses.push({ firstName: { contains: firstName, mode: "insensitive" } });
    } else if (lastName) {
      whereClauses.push({ lastName: { contains: lastName, mode: "insensitive" } });
    }

    if (query) {
      whereClauses.push({
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
          { job: { contains: query, mode: "insensitive" } },
        ],
      });
    }

    const where = whereClauses.length > 0 ? { AND: whereClauses } : undefined;

    const citizens = await prisma.citizen.findMany({
      where,
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
    let photosData: string | null = null;
    if (body.photos) {
      photosData = typeof body.photos === "string" ? body.photos : JSON.stringify(body.photos);
    }

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
        photos: photosData,
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
