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

    let photosData: string | null | undefined = undefined;
    if (body.photos !== undefined) {
      if (body.photos === null) {
        photosData = null;
      } else if (typeof body.photos === "string") {
        photosData = body.photos;
      } else {
        photosData = JSON.stringify(body.photos);
      }
    }

    const citizen = await prisma.citizen.update({
      where: { id: params.id },
      data: {
        ...(body.firstName !== undefined && { firstName: body.firstName }),
        ...(body.lastName !== undefined && { lastName: body.lastName }),
        ...(body.birthDate !== undefined && { birthDate: body.birthDate }),
        ...(body.gender !== undefined && { gender: body.gender }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.job !== undefined && { job: body.job }),
        ...(body.photoUrl !== undefined && { photoUrl: body.photoUrl }),
        ...(photosData !== undefined && { photos: photosData }),
        ...(body.driverLicense !== undefined && { driverLicense: body.driverLicense }),
        ...(body.weaponLicense !== undefined && { weaponLicense: body.weaponLicense }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.dangerLevel !== undefined && { dangerLevel: body.dangerLevel }),
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
    const { id } = params;

    // Disconnect or cascade delete relations so deletion never fails
    await prisma.$transaction(async (tx) => {
      // 1. Unlink vehicles owned by this citizen
      await tx.registeredVehicle.updateMany({
        where: { ownerId: id },
        data: { ownerId: null },
      });

      // 2. Unlink registered weapons
      await tx.registeredWeapon.updateMany({
        where: { ownerId: id },
        data: { ownerId: null },
      });

      // 3. Delete warrants associated with this citizen
      await tx.warrant.deleteMany({
        where: { citizenId: id },
      });

      // 4. Delete arrest reports associated with this citizen
      await tx.arrestReport.deleteMany({
        where: { citizenId: id },
      });

      // 5. Delete citations and their items
      const citations = await tx.citation.findMany({
        where: { citizenId: id },
        select: { id: true },
      });
      const citationIds = citations.map((c) => c.id);
      if (citationIds.length > 0) {
        await tx.citationItem.deleteMany({
          where: { citationId: { in: citationIds } },
        });
        await tx.citation.deleteMany({
          where: { citizenId: id },
        });
      }

      // 6. Delete citizen record
      await tx.citizen.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true, message: "Citoyen supprimé avec succès" });
  } catch (error) {
    console.error("DELETE citizen error:", error);
    return NextResponse.json({ error: "Failed to delete citizen" }, { status: 500 });
  }
}
