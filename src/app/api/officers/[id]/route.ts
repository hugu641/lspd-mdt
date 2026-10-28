import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/prisma";
import { verifySessionToken, stripOfficerDiscordRoles } from "../../../../lib/discord";
import { isHighCommand } from "../../../../lib/ranks";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/officers/[id]
 * Permanently deletes an officer from the MDT and revokes all Discord police/marshal roles.
 * Restricted to High Command officers (US Marshal, État-Major, Capitaine+).
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const officerId = params.id;
    if (!officerId) {
      return NextResponse.json({ error: "Identifiant d'agent manquant" }, { status: 400 });
    }

    // 1. Verify requester permissions
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("lspd_session")?.value;
    const session = sessionCookie ? verifySessionToken(sessionCookie) : null;

    if (session) {
      const requester = await prisma.officer.findUnique({
        where: { id: session.officerId },
      });
      if (requester && !isHighCommand(requester)) {
        return NextResponse.json(
          { error: "Accès refusé : Seuls les membres du Haut Commandement (US Marshal, Chief, Assistant-Chief, Deputy-Chief) peuvent supprimer un agent du site." },
          { status: 403 }
        );
      }
    }

    // 2. Find target officer
    const targetOfficer = await prisma.officer.findUnique({
      where: { id: officerId },
    });

    if (!targetOfficer) {
      return NextResponse.json({ error: "Agent introuvable dans la base de données." }, { status: 404 });
    }

    // 3. Strip all police and rank roles on Discord if Discord ID is present
    let discordRevocation = null;
    if (targetOfficer.discordId) {
      try {
        discordRevocation = await stripOfficerDiscordRoles(targetOfficer.discordId);
      } catch (dErr) {
        console.error("Erreur lors de la révocation des rôles Discord à la suppression:", dErr);
      }
    }

    // 4. Cleanly delete in a transaction to satisfy foreign key constraints
    await prisma.$transaction([
      prisma.officerBadge.deleteMany({ where: { officerId } }),
      prisma.trainingRegistration.deleteMany({ where: { officerId } }),
      prisma.trainingSession.deleteMany({ where: { instructorId: officerId } }),
      prisma.trainingCourse.updateMany({ where: { creatorId: officerId }, data: { creatorId: null } }),
      prisma.warrant.deleteMany({ where: { officerId } }),
      prisma.citationItem.deleteMany({ where: { citation: { officerId } } }),
      prisma.citation.deleteMany({ where: { officerId } }),
      prisma.arrestReport.deleteMany({ where: { officerId } }),
      prisma.investigation.deleteMany({ where: { leadOfficerId: officerId } }),
      prisma.officer.delete({ where: { id: officerId } }),
    ]);

    return NextResponse.json({
      success: true,
      message: `L'agent ${targetOfficer.name} (#${targetOfficer.badgeNumber}) a été supprimé du site avec succès.`,
      discordRevocation,
    });
  } catch (error: any) {
    console.error("DELETE officer error:", error);
    return NextResponse.json(
      { error: error?.message || "Échec de la suppression de l'agent." },
      { status: 500 }
    );
  }
}
