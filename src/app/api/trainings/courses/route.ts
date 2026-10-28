import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    const courses = await prisma.trainingCourse.findMany({
      include: {
        creator: true,
        _count: {
          select: {
            sessions: true,
            awardedBadges: true,
          },
        },
      },
      orderBy: { title: "asc" },
    });
    return NextResponse.json(courses);
  } catch (error) {
    console.error("GET training courses error:", error);
    return NextResponse.json({ error: "Failed to fetch training courses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const course = await prisma.trainingCourse.create({
      data: {
        title: body.title,
        description: body.description,
        category: body.category || "Spécialité",
        badgeName: body.badgeName,
        badgeIcon: body.badgeIcon || "Award",
        prerequisiteRank: body.prerequisiteRank || "Rookie",
        creatorId: body.creatorId || null,
      },
    });
    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("POST training course error:", error);
    return NextResponse.json({ error: "Failed to create training course" }, { status: 500 });
  }
}
