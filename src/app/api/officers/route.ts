import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const officers = await prisma.officer.findMany({
      include: {
        badges: {
          include: {
            course: true,
          },
        },
      },
      orderBy: { badgeNumber: "asc" },
    });
    return NextResponse.json(officers);
  } catch (error) {
    console.error("GET officers error:", error);
    return NextResponse.json({ error: "Failed to fetch officers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const officer = await prisma.officer.create({
      data: {
        badgeNumber: body.badgeNumber,
        name: body.name,
        callsign: body.callsign || `1-ADAM-${body.badgeNumber}`,
        rank: body.rank || "Rookie",
        department: body.department || "LSPD",
        avatarUrl: body.avatarUrl || null,
        phone: body.phone || null,
        status: "10-10",
        unitType: body.unitType || "Lincoln",
        isInstructor: Boolean(body.isInstructor),
        isAdmin: Boolean(body.isAdmin),
      },
    });
    return NextResponse.json(officer, { status: 201 });
  } catch (error) {
    console.error("POST officer error:", error);
    return NextResponse.json({ error: "Failed to create officer" }, { status: 500 });
  }
}
