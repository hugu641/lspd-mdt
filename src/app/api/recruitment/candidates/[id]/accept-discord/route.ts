import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { assignRecruitmentAcceptedDiscordRoleAndNotify } from "../../../../../../lib/discord";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const recruiterOfficer = body.recruiterOfficer;

    const candidate = await prisma.recruitmentCandidate.findUnique({
      where: { id },
      include: { recruiter: true },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidat introuvable." }, { status: 404 });
    }

    if (!candidate.discordId) {
      return NextResponse.json(
        {
          error:
            "Ce candidat n'a pas d'identifiant Discord enregistré. Il doit vérifier son compte Discord pour recevoir son rôle et sa notification.",
        },
        { status: 400 }
      );
    }

    const result = await assignRecruitmentAcceptedDiscordRoleAndNotify(
      candidate,
      recruiterOfficer || candidate.recruiter
    );

    if (!result.success && !result.roleGranted && !result.dmSent) {
      return NextResponse.json({ error: result.error || "Échec de l'action Discord" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/recruitment/candidates/[id]/accept-discord error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur interne lors de l'attribution du rôle et de la notification" },
      { status: 500 }
    );
  }
}
