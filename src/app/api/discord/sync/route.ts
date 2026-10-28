import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { syncOfficerDiscordRoles } from "../../../../lib/discord";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const officerId = body.officerId;

    if (officerId) {
      // Sync single officer
      const officer = await prisma.officer.findUnique({
        where: { id: officerId },
      });

      if (!officer) {
        return NextResponse.json({ error: "Agent introuvable" }, { status: 404 });
      }

      if (!officer.discordId) {
        return NextResponse.json(
          { error: "Cet agent n'a pas d'identifiant Discord configuré" },
          { status: 400 }
        );
      }

      const syncResult = await syncOfficerDiscordRoles({
        discordId: officer.discordId,
        rank: officer.rank,
        department: officer.department,
        isInstructor: officer.isInstructor,
      });

      return NextResponse.json({
        success: syncResult.success,
        results: [syncResult],
      });
    }

    // Sync all officers with a discordId
    const officers = await prisma.officer.findMany({
      where: {
        discordId: {
          not: null,
        },
      },
    });

    if (officers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun agent n'a d'ID Discord renseigné pour le moment.",
        results: [],
      });
    }

    const results = [];
    for (const off of officers) {
      if (off.discordId) {
        const res = await syncOfficerDiscordRoles({
          discordId: off.discordId,
          rank: off.rank,
          department: off.department,
          isInstructor: off.isInstructor,
        });
        results.push({ officerName: off.name, badgeNumber: off.badgeNumber, ...res });
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount: results.filter((r) => r.success).length,
      totalCount: officers.length,
      results,
    });
  } catch (error: any) {
    console.error("POST discord sync error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur de synchronisation des rôles" },
      { status: 500 }
    );
  }
}
