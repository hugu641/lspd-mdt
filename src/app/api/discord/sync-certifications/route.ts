import { NextResponse } from "next/server";
import { syncAllOfficersFromDiscord, syncOfficerFromDiscord } from "../../../../lib/discord";

export const dynamic = "force-dynamic";

// POST: Scan all Discord roles and apply certifications + ranks in real time
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { discordId, officerId } = body;

    // Single officer sync
    if (discordId || officerId) {
      const synced = await syncOfficerFromDiscord(discordId || officerId);
      if (!synced) {
        return NextResponse.json(
          { error: "Impossible de synchroniser cet officier depuis Discord" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        officer: synced,
        message: `Officier #${synced.badgeNumber} ${synced.name} synchronisé avec succès ! (Grade : ${synced.rank}, ${synced.badges?.length || 0} badges)`,
      });
    }

    // Full guild scan for all officers
    const result = await syncAllOfficersFromDiscord();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/discord/sync-certifications error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors du scan des certifications Discord" },
      { status: 500 }
    );
  }
}
