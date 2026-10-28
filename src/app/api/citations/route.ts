import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || 20;

    const citations = await prisma.citation.findMany({
      take: limit,
      include: {
        citizen: true,
        officer: true,
        items: {
          include: {
            penalCodeItem: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(citations);
  } catch (error) {
    console.error("GET citations error:", error);
    return NextResponse.json({ error: "Failed to fetch citations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const count = await prisma.citation.count();
    const citationNumber = `PV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const citation = await prisma.citation.create({
      data: {
        citationNumber,
        citizenId: body.citizenId,
        officerId: body.officerId,
        location: body.location || "Los Santos",
        notes: body.notes || null,
        totalFine: Number(body.totalFine) || 0,
        totalJailTime: Number(body.totalJailTime) || 0,
        status: body.status || "Impayée",
        items: {
          create: (body.items || []).map((item: any) => ({
            penalCodeItemId: item.penalCodeItemId,
            count: Number(item.count) || 1,
            fine: Number(item.fine) || 0,
            jailTime: Number(item.jailTime) || 0,
          })),
        },
      },
      include: {
        citizen: true,
        officer: true,
        items: {
          include: {
            penalCodeItem: true,
          },
        },
      },
    });

    return NextResponse.json(citation, { status: 201 });
  } catch (error) {
    console.error("POST citation error:", error);
    return NextResponse.json({ error: "Failed to create citation" }, { status: 500 });
  }
}
