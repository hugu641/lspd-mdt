import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const citizen = await prisma.citizen.findUnique({
      where: { id: params.id },
      include: {
        warrants: {
          include: {
            officer: true,
          },
          orderBy: { createdAt: "desc" },
        },
        vehicles: {
          orderBy: { createdAt: "desc" },
        },
        weapons: {
          orderBy: { createdAt: "desc" },
        },
        citations: {
          include: {
            officer: true,
            items: {
              include: {
                penalCodeItem: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        arrestReports: {
          include: {
            officer: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!citizen) {
      return NextResponse.json({ error: "Citizen not found" }, { status: 404 });
    }

    return NextResponse.json(citizen);
  } catch (error) {
    console.error("GET citizen by id error:", error);
    return NextResponse.json({ error: "Failed to fetch citizen" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const citizen = await prisma.citizen.update({
      where: { id: params.id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        birthDate: body.birthDate,
        gender: body.gender,
        phone: body.phone,
        address: body.address,
        job: body.job,
        photoUrl: body.photoUrl,
        driverLicense: body.driverLicense,
        weaponLicense: body.weaponLicense,
        notes: body.notes,
        dangerLevel: body.dangerLevel,
      },
    });
    return NextResponse.json(citizen);
  } catch (error) {
    console.error("PUT citizen error:", error);
    return NextResponse.json({ error: "Failed to update citizen" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.citizen.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE citizen error:", error);
    return NextResponse.json({ error: "Failed to delete citizen" }, { status: 500 });
  }
}
