import { NextResponse } from "next/server";
import { testDiscordConnection, canEditDiscordSettings } from "../../../../lib/discord";

export async function POST(req: Request) {
  try {
    if (!(await canEditDiscordSettings())) {
      return NextResponse.json({ success: false, error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const result = await testDiscordConnection(body.botToken, body.guildId);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST discord test error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Erreur lors du test de connexion Discord" },
      { status: 500 }
    );
  }
}
