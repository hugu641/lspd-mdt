import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const codes = await prisma.radioCodeReference.findMany({
      where: type ? { codeType: type } : undefined,
      orderBy: { orderIndex: "asc" },
    });
    return NextResponse.json(codes);
  } catch (error) {
    console.error("GET radio codes error:", error);
    return NextResponse.json({ error: "Failed to fetch radio codes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = await prisma.radioCodeReference.create({
      data: {
        codeType: body.codeType, // TEN_CODE, UNIT_CALLSIGN, URGENCY_CODE, PROCEDURE
        code: body.code,
        title: body.title,
        description: body.description || null,
        orderIndex: Number(body.orderIndex) || 99,
      },
    });
    return NextResponse.json(code, { status: 201 });
  } catch (error) {
    console.error("POST radio code error:", error);
    return NextResponse.json({ error: "Failed to create radio code" }, { status: 500 });
  }
}
