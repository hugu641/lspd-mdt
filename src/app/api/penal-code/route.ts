import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const items = await prisma.penalCodeItem.findMany({
      orderBy: { orderIndex: "asc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("GET penal code error:", error);
    return NextResponse.json({ error: "Failed to fetch penal code items" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const item = await prisma.penalCodeItem.create({
      data: {
        code: body.code,
        title: body.title,
        category: body.category, // Contraventions, Délits, Crimes, Crimes fédéraux
        fine: Number(body.fine) || 0,
        jailTime: Number(body.jailTime) || 0,
        secondarySanction: body.secondarySanction || null,
        description: body.description?.trim() || null,
        section: body.section?.trim() || null,
        orderIndex: Number(body.orderIndex) || 99,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("POST penal code error:", error);
    return NextResponse.json({ error: "Failed to create penal code item" }, { status: 500 });
  }
}
