import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    const sessions = await prisma.trainingSession.findMany({
      include: {
        course: true,
        instructor: true,
        registrations: {
          include: {
            officer: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("GET training sessions error:", error);
    return NextResponse.json({ error: "Failed to fetch training sessions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const session = await prisma.trainingSession.create({
      data: {
        courseId: body.courseId,
        instructorId: body.instructorId,
        scheduledAt: new Date(body.scheduledAt),
        location: body.location || "PDP Los Santos",
        maxSeats: Number(body.maxSeats) || 6,
        notes: body.notes || null,
        status: "Planifiée",
      },
      include: {
        course: true,
        instructor: true,
        registrations: true,
      },
    });
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("POST training session error:", error);
    return NextResponse.json({ error: "Failed to create training session" }, { status: 500 });
  }
}
