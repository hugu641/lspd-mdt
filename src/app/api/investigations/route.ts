import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const investigations = await prisma.investigation.findMany({
      include: {
        leadOfficer: true,
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(investigations);
  } catch (error) {
    console.error("GET investigations error:", error);
    return NextResponse.json({ error: "Failed to fetch investigations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const count = await prisma.investigation.count();
    const caseNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

    const investigation = await prisma.investigation.create({
      data: {
        caseNumber,
        title: body.title,
        summary: body.summary,
        status: body.status || "Ouvert",
        dangerLevel: body.dangerLevel || "Moyen",
        leadOfficerId: body.leadOfficerId,
        suspects: body.suspects || null,
        evidence: body.evidence || null,
        notes: body.notes || null,
      },
      include: {
        leadOfficer: true,
      },
    });
    return NextResponse.json(investigation, { status: 201 });
  } catch (error) {
    console.error("POST investigation error:", error);
    return NextResponse.json({ error: "Failed to create investigation" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const investigation = await prisma.investigation.update({
      where: { id: body.id },
      data: {
        title: body.title,
        summary: body.summary,
        status: body.status,
        dangerLevel: body.dangerLevel,
        suspects: body.suspects,
        evidence: body.evidence,
        notes: body.notes,
      },
      include: {
        leadOfficer: true,
      },
    });
    return NextResponse.json(investigation);
  } catch (error) {
    console.error("PATCH investigation error:", error);
    return NextResponse.json({ error: "Failed to update investigation" }, { status: 500 });
  }
}
