import { NextResponse } from "next/server";
import { getDiscordConfig, getDiscordOAuthUrl } from "../../../../../lib/discord";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const config = await getDiscordConfig();
    const url = new URL(req.url);
    const redirectUri = `${url.origin}/api/auth/discord/callback`;

    if (!config.clientId) {
      return NextResponse.redirect(
        new URL("/login?error=" + encodeURIComponent("Client ID Discord non configuré dans l'administration."), req.url)
      );
    }

    const discordAuthUrl = await getDiscordOAuthUrl(redirectUri);
    return NextResponse.redirect(discordAuthUrl);
  } catch (error: any) {
    console.error("Discord login error:", error);
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent(error?.message || "Erreur de redirection Discord"), req.url)
    );
  }
}
