import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/prisma";
import {
  verifySessionToken,
  stripOfficerDiscordRoles,
  updateDiscordMemberNickname,
  getSessionOfficer,
  officerEditError,
} from "../../../../lib/discord";
import { isHighCommand } from "../../../../lib/ranks";

export const dynamic = "force-dynamic";

/**
 * GET /api/officers/[id]
 * Returns full profile of an officer: personal info, service weapons, citations history, warrants, badges.
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const officerId = params.id;
    if (!officerId) {
      return NextResponse.json({ error: "Identifiant d'agent manquant" }, { status: 400 });
    }

    const officer = await prisma.officer.findUnique({
      where: { id: officerId },
      include: {
        citations: {
          include: {
            citizen: true,
            items: {
              include: {
                penalCodeItem: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        warrantsIssued: {
          include: { citizen: true },
          orderBy: { createdAt: "desc" },
        },
        arrestReports: {
          include: { citizen: true },
          orderBy: { createdAt: "desc" },
        },
        badges: {
          include: { course: true },
          orderBy: { awardedAt: "desc" },
        },
      },
    });

    if (!officer) {
      return NextResponse.json({ error: "Agent introuvable" }, { status: 404 });
    }

    return NextResponse.json(officer);
  } catch (error: any) {
    console.error("GET officer error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors de la récupération de l'agent" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/officers/[id]
 * Updates an officer's profile (name, badgeNumber, in-game phone, avatarUrl, serviceWeapons, callsign).
 * Also renames the member on Discord if name or badge number is updated.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const officerId = params.id;
    if (!officerId) {
      return NextResponse.json({ error: "Identifiant d'agent manquant" }, { status: 400 });
    }

    const body = await req.json();
    const permissionError = officerEditError(await getSessionOfficer(), officerId, body);
    if (permissionError) {
      return NextResponse.json({ error: permissionError }, { status: 403 });
    }
    const updateData: Record<string, any> = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.badgeNumber !== undefined) updateData.badgeNumber = body.badgeNumber.trim();
    if (body.phone !== undefined) updateData.phone = body.phone ? body.phone.trim() : null;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl ? body.avatarUrl.trim() : null;
    if (body.callsign !== undefined) updateData.callsign = body.callsign.trim();
    if (body.serviceWeapons !== undefined) updateData.serviceWeapons = body.serviceWeapons;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.unitType !== undefined) updateData.unitType = body.unitType;
    if (body.rank !== undefined) updateData.rank = body.rank;
    if (body.isInstructor !== undefined) updateData.isInstructor = Boolean(body.isInstructor);
    if (body.isInvestigator !== undefined) updateData.isInvestigator = Boolean(body.isInvestigator);

    const updatedOfficer = await prisma.officer.update({
      where: { id: officerId },
      data: updateData,
    });

    // If name or badgeNumber changed and Discord ID is available, rename the member on Discord!
    let discordNicknameResult = null;
    if ((body.name !== undefined || body.badgeNumber !== undefined) && updatedOfficer.discordId) {
      try {
        discordNicknameResult = await updateDiscordMemberNickname(
          updatedOfficer.discordId,
          updatedOfficer.name
        );
      } catch (nickErr) {
        console.error("Error renaming member on Discord:", nickErr);
      }
    }

    return NextResponse.json({
      ...updatedOfficer,
      discordNicknameResult,
    });
  } catch (error: any) {
    console.error("PATCH officer error:", error);
    return NextResponse.json(
      { error: error?.message || "Échec de la mise à jour de l'agent" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/officers/[id]
 * Permanently deletes an officer from the MDT and revokes all Discord police/marshal roles.
 * Restricted to High Command officers (US Marshal, Chief, Assistant-Chief, Deputy-Chief).
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
      if (!isHighCommand(requester)) {
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
