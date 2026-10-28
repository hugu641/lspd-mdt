import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/prisma";
import { verifySessionToken, getDiscordConfig } from "../../../../lib/discord";

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
    const officer = await prisma.officer.findUnique({
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
