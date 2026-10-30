import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getDiscordConfig, sendWelcomeDM, syncOfficerDiscordRoles, getSessionOfficer } from "../../../lib/discord";
import { isHighCommand } from "../../../lib/ranks";

export async function GET() {
  try {
    const officers = await prisma.officer.findMany({
      include: {
        badges: {
          include: {
            course: true,
          },
        },
      },
      orderBy: { badgeNumber: "asc" },
    });
    return NextResponse.json(officers);
  } catch (error) {
    console.error("GET officers error:", error);
    return NextResponse.json({ error: "Failed to fetch officers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Creating an officer sets rank, admin flag and linked Discord account.
    if (!isHighCommand(await getSessionOfficer())) {
      return NextResponse.json({ error: "Seul le Haut Commandement peut créer un agent." }, { status: 403 });
    }
    const body = await req.json();

    const cleanDiscordId = body.discordId ? body.discordId.trim().replace(/[<@!>]/g, "") : null;
    const cleanDiscordTag = body.discordTag ? body.discordTag.trim() : null;

    const officer = await prisma.officer.create({
      data: {
        badgeNumber: body.badgeNumber,
        name: body.name,
        callsign: body.callsign || `1-ADAM-${body.badgeNumber}`,
        rank: body.rank || "Rookie",
        department: body.department || "LSPD",
        avatarUrl: body.avatarUrl || null,
        phone: body.phone || null,
        status: "10-10",
        unitType: body.unitType || "Lincoln",
        isInstructor: Boolean(body.isInstructor),
        isAdmin: Boolean(body.isAdmin),
        discordId: cleanDiscordId,
        discordTag: cleanDiscordTag,
      },
    });

    // Discord Automated Actions: Welcome MP & Role Assignment
    let discordNotificationResult = null;
    let discordRoleResult = null;

    if (cleanDiscordId) {
      try {
        const config = await getDiscordConfig();

        // 1. Send Welcome MP
        if (config.sendWelcomeDm && config.botToken) {
          discordNotificationResult = await sendWelcomeDM({
            name: officer.name,
            badgeNumber: officer.badgeNumber,
            rank: officer.rank,
            callsign: officer.callsign,
            unitType: officer.unitType,
            department: officer.department,
            phone: officer.phone,
            discordId: cleanDiscordId,
          });
        }

        // 2. Automatically assign Discord roles
        if (config.autoSyncRoles && config.botToken && config.guildId) {
          discordRoleResult = await syncOfficerDiscordRoles({
            discordId: cleanDiscordId,
            rank: officer.rank,
            department: officer.department,
            isInstructor: officer.isInstructor,
          });
        }
      } catch (discordErr) {
        console.error("Discord post-creation hook error:", discordErr);
      }
    }

    return NextResponse.json(
      {
        ...officer,
        discordIntegration: {
          dm: discordNotificationResult,
          roles: discordRoleResult,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST officer error:", error);
    return NextResponse.json({ error: "Failed to create officer" }, { status: 500 });
  }
}
