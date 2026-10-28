import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { syncOfficerDiscordRoles } from "../../../../lib/discord";

export async function GET(req: Request) {
  try {
    const officers = await prisma.officer.findMany({
      orderBy: [{ isRecruiter: "desc" }, { rank: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(officers);
  } catch (error: any) {
    console.error("GET recruiters error:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les agents recruteurs" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { officerId, isRecruiter } = body;

    if (!officerId) {
      return NextResponse.json({ error: "Identifiant agent requis" }, { status: 400 });
    }

    const updated = await prisma.officer.update({
      where: { id: officerId },
      data: {
        isRecruiter: Boolean(isRecruiter),
      },
    });

    // If officer has a Discord ID, synchronize their Discord roles
    if (updated.discordId) {
      try {
        await syncOfficerDiscordRoles({
          discordId: updated.discordId,
          rank: updated.rank,
          department: updated.department,
          isInstructor: updated.isInstructor,
          isRecruiter: updated.isRecruiter,
        });
      } catch (syncErr) {
        console.warn("Discord role sync warning on recruiter toggle:", syncErr);
      }
    }

    return NextResponse.json({
      success: true,
      officer: updated,
      message: `Rôle Recruteur ${updated.isRecruiter ? "attribué" : "retiré"} à ${updated.name}`,
    });
  } catch (error: any) {
    console.error("POST recruiters error:", error);
    return NextResponse.json(
      { error: "Impossible de modifier le rôle recruteur de l'agent" },
      { status: 500 }
    );
  }
}
