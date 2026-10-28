import { NextResponse } from "next/server";
import {
  exchangeDiscordCode,
  getDiscordUser,
  checkUserLSPDAccess,
  createSessionToken,
  getRequestRedirectUri,
  getRequestBaseUrl,
  getDiscordConfig,
} from "../../../../../lib/discord";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const errorParam = url.searchParams.get("error");
  const state = url.searchParams.get("state");
  const redirectUri = getRequestRedirectUri(req);
  const baseUrl = getRequestBaseUrl(req);

  // =========================================================================
  // SPECIAL FLOW: CANDIDATE RECRUITMENT DISCORD VERIFICATION
  // (No officer LSPD roles required, captures Discord identity for role & DMs)
  // =========================================================================
  if (state === "recruitment") {
    if (errorParam || !code) {
      const desc = url.searchParams.get("error_description") || "Vérification Discord annulée par l'utilisateur.";
      return NextResponse.redirect(`${baseUrl}/recruitment/apply?error=${encodeURIComponent(desc)}`);
    }

    try {
      const tokenData = await exchangeDiscordCode(code, redirectUri);
      const discordUser = await getDiscordUser(tokenData.access_token);

      // Check if candidate is on the LSPD Discord guild
      const config = await getDiscordConfig();
      let onGuild = false;
      if (config.botToken && config.guildId) {
        try {
          const mRes = await fetch(
            `https://discord.com/api/v10/guilds/${config.guildId}/members/${discordUser.id}`,
            { headers: { Authorization: `Bot ${config.botToken}` } }
          );
          onGuild = mRes.ok;
        } catch {}
      }

      const avatarUrl = discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : "";

      const targetUrl = new URL(`${baseUrl}/recruitment/apply`);
      targetUrl.searchParams.set("discordId", discordUser.id);
      targetUrl.searchParams.set("discordTag", discordUser.username);
      targetUrl.searchParams.set("discordName", discordUser.global_name || discordUser.username);
      if (avatarUrl) targetUrl.searchParams.set("discordAvatar", avatarUrl);
      targetUrl.searchParams.set("onGuild", onGuild ? "1" : "0");
      targetUrl.searchParams.set("verified", "1");

      return NextResponse.redirect(targetUrl.toString());
    } catch (err: any) {
      console.error("Candidate Discord OAuth callback error:", err);
      return NextResponse.redirect(
        `${baseUrl}/recruitment/apply?error=${encodeURIComponent(err?.message || "Erreur de vérification Discord")}`
      );
    }
  }

  // =========================================================================
  // STANDARD FLOW: LSPD OFFICER TERMINAL LOGIN
  // =========================================================================
  if (errorParam || !code) {
    const desc = url.searchParams.get("error_description") || "Connexion annulée ou refusée par l'utilisateur.";
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(desc)}`);
  }

  try {
    // 1. Exchange code for access token
    const tokenData = await exchangeDiscordCode(code, redirectUri);

    // 2. Fetch Discord User
    const discordUser = await getDiscordUser(tokenData.access_token);

    // 3. Verify LSPD Guild Membership & Roles
    const accessCheck = await checkUserLSPDAccess(discordUser, tokenData.access_token);

    if (!accessCheck.allowed) {
      return NextResponse.redirect(
        `${baseUrl}/login?error=${encodeURIComponent(accessCheck.reason || "Accès refusé.")}`
      );
    }

    const officer = accessCheck.officer;

    // 4. Create Signed Session
    const sessionToken = createSessionToken({
      officerId: officer?.id || "demo",
      discordId: discordUser.id,
      username: discordUser.username,
      rank: officer?.rank || "Rookie",
      name: officer?.name || discordUser.username,
    });

    // 5. Create Response with HTTP-Only Cookie and redirect to Dashboard on canonical domain
    const response = NextResponse.redirect(`${baseUrl}/`);
    response.cookies.set("lspd_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Discord callback processing error:", error);
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(error?.message || "Erreur interne lors de la connexion Discord")}`
    );
  }
}
