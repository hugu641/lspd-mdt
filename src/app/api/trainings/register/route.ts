import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, officerId } = body;

    // Check if session exists and is not full
    const session = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      include: {
        registrations: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
    }

    if (session.registrations.length >= session.maxSeats) {
      return NextResponse.json({ error: "La session est complète" }, { status: 400 });
    }

    // Check if already registered
    const existing = await prisma.trainingRegistration.findFirst({
      where: { sessionId, officerId },
    });

    if (existing) {
      return NextResponse.json({ error: "Vous êtes déjà inscrit à cette session" }, { status: 400 });
    }

    const registration = await prisma.trainingRegistration.create({
      data: {
        sessionId,
        officerId,
        status: "Inscrit",
      },
      include: {
        session: {
          include: {
            course: true,
          },
        },
        officer: true,
      },
    });

    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    console.error("POST registration error:", error);
    return NextResponse.json({ error: "Échec de l'inscription" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { registrationId, status, notes, evaluatedBy } = body;

    const registration = await prisma.trainingRegistration.update({
      where: { id: registrationId },
      data: {
        status, // "Validé", "Échoué", "Absent"
        notes: notes || undefined,
        completedAt: status === "Validé" || status === "Échoué" ? new Date() : null,
      },
      include: {
        session: true,
        officer: true,
      },
    });

    // If validated, automatically grant the badge if not already owned!
    if (status === "Validé") {
      const existingBadge = await prisma.officerBadge.findFirst({
        where: {
          officerId: registration.officerId,
          courseId: registration.session.courseId,
        },
      });

      if (!existingBadge) {
        await prisma.officerBadge.create({
          data: {
            officerId: registration.officerId,
            courseId: registration.session.courseId,
            awardedBy: evaluatedBy || "Instructeur LSPD",
          },
        });
      }
    }

    return NextResponse.json(registration);
  } catch (error) {
    console.error("PATCH registration error:", error);
    return NextResponse.json({ error: "Échec de la mise à jour de l'inscription" }, { status: 500 });
  }
}
