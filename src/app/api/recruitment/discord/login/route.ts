import { NextResponse } from "next/server";
import {
  getDiscordConfig,
  getDiscordOAuthUrl,
  getRequestRedirectUri,
  getRequestBaseUrl,
} from "../../../../../lib/discord";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const baseUrl = getRequestBaseUrl(req);
  try {
    const config = await getDiscordConfig();
    const redirectUri = getRequestRedirectUri(req);

    if (!config.clientId) {
      return NextResponse.redirect(
        `${baseUrl}/recruitment/apply?error=${encodeURIComponent("Client ID Discord non configuré dans l'administration.")}`
      );
    }

    const discordAuthUrl = await getDiscordOAuthUrl(redirectUri);
    // Append &state=recruitment so the callback knows this is candidate verification
    const authUrlWithState = `${discordAuthUrl}&state=recruitment`;

    return NextResponse.redirect(authUrlWithState);
  } catch (error: any) {
    console.error("Recruitment Discord login error:", error);
    return NextResponse.redirect(
      `${baseUrl}/recruitment/apply?error=${encodeURIComponent(error?.message || "Erreur de redirection Discord")}`
    );
  }
}
