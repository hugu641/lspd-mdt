import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../../lib/prisma";
import { verifySessionToken, stripOfficerDiscordRoles } from "../../../../../lib/discord";
import { isHighCommand } from "../../../../../lib/ranks";

export const dynamic = "force-dynamic";

/**
 * POST /api/officers/[id]/strip-roles
 * Strips all police, marshal and instructor roles from an officer on Discord
 * and resets/revokes their rank on the MDT site.
 * Restricted to High Command officers.
 */
export async function POST(
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
          { error: "Accès refusé : Seuls les membres du Haut Commandement (US Marshal, Chief, Assistant-Chief, Deputy-Chief) peuvent retirer les rôles d'un agent." },
          { status: 403 }
        );
      }
    }

    // 2. Find target officer
    const targetOfficer = await prisma.officer.findUnique({
      where: { id: officerId },
    });

    if (!targetOfficer) {
      return NextResponse.json({ error: "Agent introuvable." }, { status: 404 });
    }

    // 3. Strip Discord roles
    let discordRevocation: any = null;
    if (targetOfficer.discordId) {
      discordRevocation = await stripOfficerDiscordRoles(targetOfficer.discordId);
    }

    // 4. Update officer in DB (demoted/revoked rank, no instructor, no admin)
    const updatedOfficer = await prisma.officer.update({
      where: { id: officerId },
      data: {
        rank: "Révoqué",
        isInstructor: false,
        isAdmin: false,
        status: "10-10",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Rôles retirés pour ${targetOfficer.name}.`,
      removedRoles: discordRevocation?.removedRoles || [],
      officer: updatedOfficer,
    });
  } catch (error: any) {
    console.error("strip-roles error:", error);
    return NextResponse.json(
      { error: error?.message || "Échec du retrait des rôles de l'agent." },
      { status: 500 }
    );
  }
}
