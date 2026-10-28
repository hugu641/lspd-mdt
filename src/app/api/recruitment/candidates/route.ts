import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: Request) {
  try {
    const candidates = await prisma.recruitmentCandidate.findMany({
      include: {
        recruiter: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(candidates);
  } catch (error: any) {
    console.error("GET /api/recruitment/candidates error:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les candidatures" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.firstName?.trim() || !body.lastName?.trim()) {
      return NextResponse.json(
        { error: "Nom et prénom du postulant obligatoires" },
        { status: 400 }
      );
    }

    const candidate = await prisma.recruitmentCandidate.create({
      data: {
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        phone: body.phone?.trim() || null,
        discordTag: body.discordTag?.trim() || null,
        discordId: body.discordId?.trim() || null,
        discordAvatar: body.discordAvatar?.trim() || null,
        age: body.age ? parseInt(body.age) : null,
        availability: body.availability?.trim() || null,
        motivation: body.motivation?.trim() || null,
        experience: body.experience?.trim() || null,
        customAnswers: body.customAnswers
          ? typeof body.customAnswers === "string"
            ? body.customAnswers
            : JSON.stringify(body.customAnswers)
          : null,
        status: body.status || "En attente",
        interviewDate: body.interviewDate ? new Date(body.interviewDate) : null,
        interviewNotes: body.interviewNotes?.trim() || null,
        decisionReason: body.decisionReason?.trim() || null,
        recruiterId: body.recruiterId || null,
      },
      include: {
        recruiter: true,
      },
    });

    return NextResponse.json(candidate, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/recruitment/candidates error:", error);
    return NextResponse.json(
      { error: error?.message || "Impossible de créer la candidature" },
      { status: 500 }
    );
  }
}
