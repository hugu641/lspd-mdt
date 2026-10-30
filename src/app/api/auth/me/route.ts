import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/prisma";
import { verifySessionToken, getDiscordConfig, syncOfficerFromDiscord, checkMdtAccess } from "../../../../lib/discord";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getDiscordConfig();
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("lspd_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({
        authenticated: false,
        authRequired: config.authRequired,
        isConfigured: Boolean(config.clientId && config.botToken && config.guildId),
      });
    }

    const payload = verifySessionToken(sessionCookie);
    if (!payload) {
      return NextResponse.json({
        authenticated: false,
        authRequired: config.authRequired,
        isConfigured: Boolean(config.clientId && config.botToken && config.guildId),
      });
    }

    // Load full officer from database
    let officer = await prisma.officer.findUnique({
      where: { id: payload.officerId },
      include: {
        badges: { include: { course: true } },
      },
    });

    if (!officer) {
      return NextResponse.json({
        authenticated: false,
        authRequired: config.authRequired,
      });
    }

    // Rookie role removed or member left the Discord server: end the session immediately.
    if (officer.discordId && (await checkMdtAccess(officer.discordId)) === false) {
      const denied = NextResponse.json({
        authenticated: false,
        authRequired: config.authRequired,
        error: "Votre rôle Discord ne permet plus d'accéder au MDT.",
      });
      denied.cookies.delete("lspd_session");
      return denied;
    }

    // REAL-TIME SYNC: If officer has Discord ID, seamlessly sync their latest Discord roles, rank, and certifications
    if (officer.discordId) {
      try {
        const freshlySynced = await syncOfficerFromDiscord(officer.discordId);
        if (freshlySynced) {
          officer = freshlySynced;
        }
      } catch (syncErr) {
        console.warn("Background Discord sync skipped in /api/auth/me:", syncErr);
      }
    }

    return NextResponse.json({
      authenticated: true,
      officer,
      session: payload,
      authRequired: config.authRequired,
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
