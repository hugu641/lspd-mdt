import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { sendWelcomeDM, sendDiscordDM } from "../../../../lib/discord";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { officerId, discordId, customMessage } = body;

    let targetOfficer = null;
    let targetDiscordId = discordId;

    if (officerId) {
      targetOfficer = await prisma.officer.findUnique({ where: { id: officerId } });
      if (targetOfficer?.discordId) {
        targetDiscordId = targetOfficer.discordId;
      }
    }

    if (!targetDiscordId) {
      return NextResponse.json(
        { error: "Veuillez renseigner un ID Discord valide (17-20 chiffres)" },
        { status: 400 }
      );
    }

    if (targetOfficer) {
      // Send official formatted welcome DM
      const res = await sendWelcomeDM({
        name: targetOfficer.name,
        badgeNumber: targetOfficer.badgeNumber,
        rank: targetOfficer.rank,
        callsign: targetOfficer.callsign,
        unitType: targetOfficer.unitType,
        department: targetOfficer.department,
        phone: targetOfficer.phone,
        discordId: targetDiscordId,
      });

      if (!res.success) {
        return NextResponse.json(res, { status: 400 });
      }

      return NextResponse.json({ success: true, message: "MP de bienvenue envoyé avec succès !" });
    }

    // Send custom message / test DM
    const res = await sendDiscordDM(targetDiscordId, {
      content: customMessage || "🔔 **Test de communication Bot LSPD MDT** : Votre système est opérationnel !",
    });

    if (!res.success) {
      return NextResponse.json(res, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Message MP envoyé avec succès !" });
  } catch (error: any) {
    console.error("POST discord send-dm error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors de l'envoi du message privé" },
      { status: 500 }
    );
  }
}
