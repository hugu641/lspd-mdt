import { NextResponse } from "next/server";
import {
  exchangeDiscordCode,
  getDiscordUser,
  checkUserLSPDAccess,
  createSessionToken,
  getRequestRedirectUri,
} from "../../../../../lib/discord";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const errorParam = url.searchParams.get("error");
  const redirectUri = getRequestRedirectUri(req);

  if (errorParam || !code) {
    const desc = url.searchParams.get("error_description") || "Connexion annulée ou refusée par l'utilisateur.";
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(desc)}`, req.url));
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
        new URL(`/login?error=${encodeURIComponent(accessCheck.reason || "Accès refusé.")}`, req.url)
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

    // 5. Create Response with HTTP-Only Cookie and redirect to Dashboard
    const response = NextResponse.redirect(new URL("/", req.url));
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
      new URL(`/login?error=${encodeURIComponent(error?.message || "Erreur interne lors de la connexion Discord")}`, req.url)
    );
  }
}
